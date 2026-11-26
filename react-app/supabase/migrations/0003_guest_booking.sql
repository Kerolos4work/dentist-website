-- Guest booking: no patient account, no OAuth, reference + phone lookup.
-- Applies after 0002_sessions.sql.

create sequence if not exists public.booking_reference_seq start 100001;

alter table public.appointments
  alter column patient_id drop not null,
  add column if not exists patient_name text check (char_length(patient_name) between 2 and 80),
  add column if not exists patient_phone text check (char_length(patient_phone) <= 32),
  add column if not exists patient_email text check (char_length(patient_email) <= 320),
  add column if not exists booking_reference text;

alter table public.appointments
  add constraint appointments_identity_check
    check (
      patient_id is not null
      or (patient_name is not null and patient_phone is not null)
    );

update public.appointments
set booking_reference = 'AY-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0')
where booking_reference is null;

alter table public.appointments
  alter column booking_reference set default 'AY-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0'),
  alter column booking_reference set not null,
  add constraint appointments_booking_reference_key unique (booking_reference);

create index if not exists appointments_guest_lookup_idx
  on public.appointments (booking_reference, patient_phone);

grant usage on sequence public.booking_reference_seq to service_role, authenticated, anon;

-- Normalize local and international Egyptian numbers to one lookup format.
create or replace function public.normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = public
as $$
  with cleaned as (
    select regexp_replace(
      translate(
        coalesce(p_phone, ''),
        '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹',
        '01234567890123456789'
      ),
      '[^0-9]',
      '',
      'g'
    ) as digits
  )
  select case
    when length(digits) = 11 and left(digits, 1) = '0'
      then '+20' || substring(digits from 2)
    when length(digits) = 10 and left(digits, 1) = '0'
      then '+20' || substring(digits from 2)
    when length(digits) = 9 and left(digits, 1) <> '0'
      then '+20' || digits
    when length(digits) = 12 and left(digits, 2) = '20'
      then '+' || digits
    when length(digits) = 14 and left(digits, 4) = '0020'
      then '+' || substring(digits from 3)
    when length(digits) between 10 and 15
      then '+' || digits
    else null
  end
  from cleaned;
$$;

-- Atomic guest booking. The Edge Function (service role) may call this only.
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
  out_booking_reference text
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
  v_status public.appointment_status;
  v_payment public.payment_status;
  v_end time;
  v_labels jsonb := '{
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
  where p_time >= s.start_time
    and p_time < s.end_time
    and (floor(extract(epoch from (p_time - s.start_time)) / 60)::integer % v_slot) = 0
  order by s.start_time
  limit 1;

  if not found then
    raise exception 'Time is outside working hours';
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

  if exists (
    select 1
    from public.appointments a
    where a.appointment_date = p_date
      and a.start_time = p_time
      and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived')
  ) then
    raise exception 'Slot is taken';
  end if;

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
  v_end := (p_time + (v_slot || ' minutes')::interval)::time;

  insert into public.appointments as a (
    patient_name, patient_phone, patient_email,
    service_id, service_label, fee_amount, currency,
    appointment_date, start_time, end_time, status,
    payment_provider, payment_status, payment_reference, patient_note
  )
  values (
    v_name, v_phone, v_email,
    p_service_id, v_labels ->> p_service_id, 300, 'EGP',
    p_date, p_time, v_end, v_status,
    case when p_needs_payment then p_provider::public.payment_provider else null end,
    v_payment, nullif(btrim(coalesce(p_payment_reference, '')), ''), nullif(btrim(coalesce(p_note, '')), '')
  )
  returning a.id, a.status, a.payment_status, a.booking_reference
    into out_id, out_status, out_payment_status, out_booking_reference;

  -- RETURNS TABLE is a set-returning function; emit the row for PostgREST.
  return next;
end;
$$;

-- Guests read only their own booking with the reference + phone pair.
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

-- Guests cancel only with the matching reference + phone and clinic grace period.
create or replace function public.guest_cancel_appointment(
  p_reference text,
  p_phone text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference text := upper(btrim(coalesce(p_reference, '')));
  v_phone text := public.normalize_phone(p_phone);
  v_appointment record;
  v_timezone text;
  v_cancel_hours integer;
begin
  if v_reference = '' or v_phone is null then
    raise exception 'بيانات البحث غير صحيحة.';
  end if;

  select a.* into v_appointment
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

  if not found then
    raise exception 'لم نعثر على حجز بهذا الرقم ورقم الهاتف.';
  end if;

  if v_appointment.status in ('cancelled', 'declined', 'completed') then
    raise exception 'لا يمكن إلغاء هذا الموعد.';
  end if;

  select timezone, cancel_hours_before
    into v_timezone, v_cancel_hours
  from public.doctor_settings
  where id = 'clinic';

  v_timezone := coalesce(v_timezone, 'Africa/Cairo');
  v_cancel_hours := coalesce(v_cancel_hours, 0);

  if now() > (
    (v_appointment.appointment_date + v_appointment.start_time) at time zone v_timezone
    - make_interval(hours => v_cancel_hours)
  ) then
    raise exception 'انتهت فترة الإلغاء المسموح بها.';
  end if;

  update public.appointments
  set status = 'cancelled'
  where id = v_appointment.id;

  return true;
end;
$$;

revoke all on function public.normalize_phone(text) from public, anon, authenticated;
grant execute on function public.normalize_phone(text) to service_role;

revoke all on function public.create_guest_appointment(text, text, text, text, date, time, text, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.create_guest_appointment(text, text, text, text, date, time, text, boolean, text, text)
  to service_role;

revoke all on function public.guest_lookup_appointment(text, text) from public, anon, authenticated;
grant execute on function public.guest_lookup_appointment(text, text) to anon, authenticated;

revoke all on function public.guest_cancel_appointment(text, text) from public, anon, authenticated;
grant execute on function public.guest_cancel_appointment(text, text) to anon, authenticated;
