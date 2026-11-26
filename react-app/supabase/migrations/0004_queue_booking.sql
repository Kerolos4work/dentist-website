-- Queue-based guest booking: patients choose a date and a doctor session.
-- A booking no longer reserves an exact patient-picked time. The database
-- assigns the first free place in the session, then derives the queue number,
-- expected wait and doctor arrival time from that place.
-- Applies after 0003_guest_booking.sql.

alter table public.appointments
  add column if not exists queue_number integer check (queue_number between 1 and 200),
  add column if not exists expected_wait_minutes integer check (expected_wait_minutes >= 0),
  add column if not exists doctor_arrival_time time;

-- The optional specialty uses the real general check-up service.
alter table public.appointments
  drop constraint if exists appointments_service_id_check,
  add constraint appointments_service_id_check check (
    service_id in (
      'general-checkup',
      'full-arch',
      'veneers-and-smile-design',
      'implants',
      'root-canal',
      'orthodontics',
      'periodontics',
      'pediatric',
      'prosthodontics'
    )
  );

-- Backfill existing rows so guest lookup can show queue details immediately.
do $$
declare
  v_slot integer;
begin
  select slot_minutes into v_slot from public.doctor_settings where id = 'clinic';

  update public.appointments a
  set queue_number = ranked.rn,
      expected_wait_minutes = (ranked.rn - 1) * v_slot,
      doctor_arrival_time = ranked.session_start
  from (
    select ap.id,
           s.start_time as session_start,
           row_number() over (
             partition by ap.appointment_date, s.start_time
             order by ap.start_time, ap.created_at
           ) as rn
    from public.appointments ap
    join public.booking_sessions_for_date(ap.appointment_date) s
      on ap.start_time >= s.start_time
     and ap.start_time < s.end_time
    where ap.queue_number is null
  ) ranked
  where a.id = ranked.id
    and v_slot is not null;
end $$;

-- Session-level availability for the patient calendar.
create or replace function public.booking_available_sessions(p_date date)
returns table (
  session_start time,
  session_end time,
  patient_limit integer,
  booked integer,
  remaining integer,
  doctor_arrival_time time
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_slot integer;
begin
  select slot_minutes into v_slot from public.doctor_settings where id = 'clinic';
  if v_slot is null then
    return;
  end if;

  return query
  select
    s.start_time,
    s.end_time,
    s.patient_limit,
    count(a.id)::integer as booked,
    greatest(0, s.patient_limit - count(a.id)::integer) as remaining,
    s.start_time as doctor_arrival_time
  from public.booking_sessions_for_date(p_date) s
  left join public.appointments a
    on a.appointment_date = p_date
   and a.start_time >= s.start_time
   and a.start_time < s.end_time
   and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived')
  group by s.start_time, s.end_time, s.patient_limit
  order by s.start_time;
end;
$$;

revoke all on function public.booking_available_sessions(date) from public, anon, authenticated;
grant execute on function public.booking_available_sessions(date) to anon, authenticated;

-- Atomic queue booking. p_time is now the session start time, not a chosen slot.
-- The return type changed, so replace the old signature explicitly.
drop function if exists public.create_guest_appointment(text, text, text, text, date, time, text, boolean, text, text);

create or replace function public.create_guest_appointment(
  p_full_name text,
  p_phone text,
  p_email text,
  p_service_id text,
  p_date date,
  p_time time,
  p_note text,
  p_needs_payment boolean,
  p_provider text,
  p_payment_reference text
)
returns table (
  out_id uuid,
  out_status public.appointment_status,
  out_payment_status public.payment_status,
  out_booking_reference text,
  out_queue_number integer,
  out_expected_wait_minutes integer,
  out_doctor_arrival_time time
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_email text;
  v_slot integer;
  v_session record;
  v_booked integer;
  v_cursor integer;
  v_candidate time;
  v_chosen time;
  v_queue integer;
  v_wait integer;
  v_status public.appointment_status;
  v_payment public.payment_status;
  v_end time;
  v_labels jsonb := '{
    "general-checkup": "كشف عام",
    "full-arch": "تركيبات الفك الكامل",
    "veneers-and-smile-design": "فينير وتصميم ابتسامة",
    "implants": "زراعة الأسنان",
    "root-canal": "علاج الجذور",
    "orthodontics": "تقويم الأسنان",
    "periodontics": "علاج اللثة",
    "pediatric": "أسنان الأطفال",
    "prosthodontics": "التركيبات"
  }'::jsonb;
begin
  v_name := btrim(coalesce(p_full_name, ''));
  v_phone := public.normalize_phone(p_phone);
  v_email := nullif(lower(btrim(coalesce(p_email, ''))), '');

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Invalid patient name';
  end if;

  if v_phone is null then
    raise exception 'Invalid phone';
  end if;

  if v_email is not null
     and (char_length(v_email) > 320 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Invalid email';
  end if;

  if p_date is null or p_date < current_date then
    raise exception 'Date is in the past';
  end if;

  if p_service_id is null or not (v_labels ? p_service_id) then
    raise exception 'Unknown service';
  end if;

  -- Serialize bookings for the same date before counting the session quota.
  perform pg_advisory_xact_lock(hashtext('booking:' || p_date::text));

  select slot_minutes into v_slot from public.doctor_settings where id = 'clinic';
  if v_slot is null then
    raise exception 'Clinic settings are missing';
  end if;

  select s.start_time, s.end_time, s.patient_limit
  into v_session
  from public.booking_sessions_for_date(p_date) s
  where s.start_time = p_time
  order by s.start_time
  limit 1;

  if not found then
    raise exception 'Session is not available';
  end if;

  select count(*)::integer into v_booked
  from public.appointments a
  where a.appointment_date = p_date
    and a.start_time >= v_session.start_time
    and a.start_time < v_session.end_time
    and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived');

  if v_booked >= v_session.patient_limit then
    raise exception 'Session is full';
  end if;

  -- Give the patient the first free place in the session. The stored
  -- start_time remains the database's estimated call time, not a patient pick.
  v_chosen := null;
  for v_cursor in 0..(
    floor(extract(epoch from (v_session.end_time - v_session.start_time)) / 60)::integer / v_slot - 1
  ) loop
    v_candidate := (v_session.start_time + ((v_cursor * v_slot) || ' minutes')::interval)::time;

    if not exists (
      select 1
      from public.appointments a
      where a.appointment_date = p_date
        and a.start_time = v_candidate
        and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived')
    ) then
      v_chosen := v_candidate;
      exit;
    end if;
  end loop;

  if v_chosen is null then
    raise exception 'Session is full';
  end if;

  select count(*)::integer + 1 into v_queue
  from public.appointments a
  where a.appointment_date = p_date
    and a.start_time >= v_session.start_time
    and a.start_time < v_session.end_time
    and a.start_time < v_chosen
    and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived');

  v_wait := (v_queue - 1) * v_slot;

  -- One active booking per phone per day, including older account bookings.
  if exists (
    select 1
    from public.appointments a
    where a.appointment_date = p_date
      and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived')
      and (
        a.patient_phone = v_phone
        or (
          a.patient_phone is null
          and a.patient_id is not null
          and exists (
            select 1
            from public.profiles pr
            where pr.id = a.patient_id
              and public.normalize_phone(pr.phone) = v_phone
          )
        )
      )
  ) then
    raise exception 'You already have an appointment on this day';
  end if;

  v_status := case
    when p_needs_payment then 'awaiting_payment'::public.appointment_status
    else 'confirmed'::public.appointment_status
  end;
  v_payment := case
    when p_needs_payment then 'awaiting_payment'::public.payment_status
    else 'due_at_clinic'::public.payment_status
  end;
  v_end := (v_chosen + (v_slot || ' minutes')::interval)::time;

  insert into public.appointments as a (
    patient_name, patient_phone, patient_email,
    service_id, service_label, fee_amount, currency,
    appointment_date, start_time, end_time, status,
    queue_number, expected_wait_minutes, doctor_arrival_time,
    payment_provider, payment_status, payment_reference, patient_note
  )
  values (
    v_name, v_phone, v_email,
    p_service_id, v_labels ->> p_service_id, 300, 'EGP',
    p_date, v_chosen, v_end, v_status,
    v_queue, v_wait, v_session.start_time,
    case when p_needs_payment then p_provider::public.payment_provider else null end,
    v_payment, nullif(btrim(coalesce(p_payment_reference, '')), ''), nullif(btrim(coalesce(p_note, '')), '')
  )
  returning a.id, a.status, a.payment_status, a.booking_reference,
            a.queue_number, a.expected_wait_minutes, a.doctor_arrival_time
    into out_id, out_status, out_payment_status, out_booking_reference,
         out_queue_number, out_expected_wait_minutes, out_doctor_arrival_time;

  -- RETURNS TABLE is a set-returning function; emit the row for PostgREST.
  return next;
end;
$$;

-- Guests read only their own booking with the reference + phone pair.
-- The return type changed, so replace the old signature explicitly.
drop function if exists public.guest_lookup_appointment(text, text);

create or replace function public.guest_lookup_appointment(
  p_reference text,
  p_phone text
)
returns table (
  id uuid,
  booking_reference text,
  service_label text,
  appointment_date date,
  start_time time,
  end_time time,
  status public.appointment_status,
  payment_status public.payment_status,
  payment_provider public.payment_provider,
  fee_amount integer,
  currency text,
  patient_name text,
  patient_phone text,
  patient_note text,
  queue_number integer,
  expected_wait_minutes integer,
  doctor_arrival_time time,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_reference text := upper(btrim(coalesce(p_reference, '')));
  v_phone text := public.normalize_phone(p_phone);
begin
  if v_reference = '' or v_phone is null then
    raise exception 'بيانات البحث غير صحيحة.';
  end if;

  return query
  select
    a.id,
    a.booking_reference,
    a.service_label,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.status,
    a.payment_status,
    a.payment_provider,
    a.fee_amount,
    a.currency,
    coalesce(
      a.patient_name,
      (select pr.full_name from public.profiles pr where pr.id = a.patient_id)
    ) as patient_name,
    coalesce(
      a.patient_phone,
      (select pr.phone from public.profiles pr where pr.id = a.patient_id)
    ) as patient_phone,
    a.patient_note,
    a.queue_number,
    a.expected_wait_minutes,
    a.doctor_arrival_time,
    a.created_at
  from public.appointments a
  where a.booking_reference = v_reference
    and (
      a.patient_phone = v_phone
      or (
        a.patient_phone is null
        and a.patient_id is not null
        and exists (
          select 1
          from public.profiles pr
          where pr.id = a.patient_id
            and public.normalize_phone(pr.phone) = v_phone
        )
      )
    )
  order by a.created_at desc
  limit 1;
end;
$$;

revoke all on function public.create_guest_appointment(text, text, text, text, date, time, text, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.create_guest_appointment(text, text, text, text, date, time, text, boolean, text, text)
  to service_role;

revoke all on function public.guest_lookup_appointment(text, text) from public, anon, authenticated;
grant execute on function public.guest_lookup_appointment(text, text) to anon, authenticated;
