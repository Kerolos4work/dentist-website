-- Doctor work sessions with weekday and one-off date exceptions.
-- Applies after 0001_appointments.sql.

create type public.session_scope as enum ('default', 'weekday', 'date');

create table public.doctor_sessions (
  id uuid primary key default gen_random_uuid(),
  scope public.session_scope not null,
  scope_key text,
  start_time time not null,
  end_time time not null,
  patient_limit integer not null check (patient_limit between 1 and 200),
  constraint sessions_default_no_key check (scope <> 'default' or scope_key is null),
  constraint sessions_scoped_has_key check (scope = 'default' or scope_key is not null),
  constraint sessions_weekday_key check (scope <> 'weekday' or scope_key ~ '^[0-6]$'),
  constraint sessions_date_key check (scope <> 'date' or scope_key ~ '^\d{4}-\d{2}-\d{2}$'),
  constraint sessions_time_order check (end_time > start_time)
);

create unique index doctor_sessions_scope_slot
  on public.doctor_sessions (scope, coalesce(scope_key, ''), start_time);

create table public.doctor_closed_dates (
  appointment_date date primary key
);

-- A session cannot promise more patients than it has time slots.
create or replace function public.validate_session_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_slot integer;
begin
  select slot_minutes into v_slot from public.doctor_settings where id = 'clinic';
  if v_slot is null then return new; end if;

  if new.patient_limit >
     floor(extract(epoch from (new.end_time - new.start_time)) / 60 / v_slot)::integer then
    raise exception 'Patient limit exceeds the number of slots in this session';
  end if;
  return new;
end;
$$;

create trigger doctor_sessions_capacity
  before insert or update on public.doctor_sessions
  for each row execute function public.validate_session_capacity();

create or replace function public.validate_settings_slot_length()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.slot_minutes is distinct from old.slot_minutes then
    if exists (
      select 1
      from public.doctor_sessions s
      where s.patient_limit >
            floor(extract(epoch from (s.end_time - s.start_time)) / 60 / new.slot_minutes)::integer
    ) then
      raise exception 'Slot length is too long for an existing session patient limit';
    end if;
  end if;
  return new;
end;
$$;

create trigger doctor_settings_slot_length_check
  before update on public.doctor_settings
  for each row execute function public.validate_settings_slot_length();

create or replace function public.validate_session_overlap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.doctor_sessions s
    where s.scope = new.scope
      and coalesce(s.scope_key, '') = coalesce(new.scope_key, '')
      and s.id is distinct from new.id
      and s.start_time < new.end_time
      and new.start_time < s.end_time
  ) then
    raise exception 'Sessions cannot overlap';
  end if;
  return new;
end;
$$;

create trigger doctor_sessions_overlap
  before insert or update on public.doctor_sessions
  for each row execute function public.validate_session_overlap();

-- Effective sessions for a date: date exception, then weekday override,
-- then defaults. Closed dates and non-open weekdays have no sessions.
create or replace function public.booking_sessions_for_date(p_date date)
returns table (start_time time, end_time time, patient_limit integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_weekday text;
  v_open integer[];
  v_has_date boolean;
begin
  if exists (
    select 1 from public.doctor_closed_dates c where c.appointment_date = p_date
  ) then
    return;
  end if;

  select extract(dow from p_date)::text into v_weekday;
  select open_days into v_open from public.doctor_settings where id = 'clinic';

  select exists (
    select 1 from public.doctor_sessions s
    where s.scope = 'date' and s.scope_key = p_date::text
  ) into v_has_date;

  if v_has_date then
    return query
      select s.start_time, s.end_time, s.patient_limit
      from public.doctor_sessions s
      where s.scope = 'date' and s.scope_key = p_date::text
      order by s.start_time;
    return;
  end if;

  if v_open is null or not (v_open @> array[extract(dow from p_date)::integer]) then
    return;
  end if;

  if exists (
    select 1 from public.doctor_sessions s
    where s.scope = 'weekday' and s.scope_key = v_weekday
  ) then
    return query
      select s.start_time, s.end_time, s.patient_limit
      from public.doctor_sessions s
      where s.scope = 'weekday' and s.scope_key = v_weekday
      order by s.start_time;
  else
    return query
      select s.start_time, s.end_time, s.patient_limit
      from public.doctor_sessions s
      where s.scope = 'default'
      order by s.start_time;
  end if;
end;
$$;

-- Slots that a patient can still book on a given date.
create or replace function public.booking_available_slots(p_date date)
returns table (
  slot time,
  session_start time,
  session_end time,
  patient_limit integer,
  booked integer,
  remaining integer
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
  if v_slot is null then return; end if;

  return query
  with counted as (
    select
      s.start_time as session_start,
      s.end_time as session_end,
      s.patient_limit as patient_limit,
      (
        select count(*)::integer
        from public.appointments a
        where a.appointment_date = p_date
          and a.start_time >= s.start_time
          and a.start_time < s.end_time
          and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived')
      ) as booked
    from public.booking_sessions_for_date(p_date) s
  ),
  candidates as (
    select
      (c.session_start + (g.n || ' minutes')::interval)::time as slot,
      c.session_start,
      c.session_end,
      c.patient_limit,
      c.booked,
      greatest(c.patient_limit - c.booked, 0) as remaining
    from counted c
    cross join lateral generate_series(
      0,
      floor(extract(epoch from (c.session_end - c.session_start)) / 60)::integer - v_slot,
      v_slot
    ) as g(n)
    where c.booked < c.patient_limit
      and not exists (
        select 1
        from public.appointments a
        where a.appointment_date = p_date
          and a.start_time = (c.session_start + (g.n || ' minutes')::interval)::time
          and a.status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived')
      )
  )
  -- Qualify every column: RETURNS TABLE names are PL/pgSQL variables too,
  -- so an unqualified `slot` here is ambiguous.
  select
    ranked.slot,
    ranked.session_start,
    ranked.session_end,
    ranked.patient_limit,
    ranked.booked,
    ranked.remaining
  from (
    select
      c.*,
      row_number() over (partition by c.session_start order by c.slot) as rn
    from candidates c
  ) ranked
  where ranked.rn <= ranked.remaining
  order by ranked.slot;
end;
$$;

grant execute on function public.booking_available_slots(date) to anon, authenticated;

-- Atomic booking: one patient per slot and a per-session patient quota.
-- Only the Edge Function (service role) may call this.
create or replace function public.create_appointment(
  p_patient uuid,
  p_service_id text,
  p_date date,
  p_time time,
  p_note text,
  p_needs_payment boolean,
  p_provider text,
  p_reference text
)
returns table (out_id uuid, out_status public.appointment_status, out_payment_status public.payment_status)
language plpgsql
security definer
set search_path = public
as $$
declare
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
  if p_patient is null or not exists (
    select 1 from public.profiles where id = p_patient
  ) then
    raise exception 'Unknown patient';
  end if;

  if p_service_id is null or not (v_labels ? p_service_id) then
    raise exception 'Unknown service';
  end if;

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
    patient_id, service_id, service_label, fee_amount, currency,
    appointment_date, start_time, end_time, status,
    payment_provider, payment_status, payment_reference, patient_note
  )
  values (
    p_patient, p_service_id, v_labels ->> p_service_id, 300, 'EGP',
    p_date, p_time, v_end, v_status,
    case when p_needs_payment then p_provider::public.payment_provider else null end,
    v_payment, p_reference, nullif(p_note, '')
  )
  returning a.id, a.status, a.payment_status into out_id, out_status, out_payment_status;

  -- RETURNS TABLE is a set-returning function; emit the row for the caller.
  return next;
end;
$$;

revoke all on function public.create_appointment(uuid, text, date, time, text, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.create_appointment(uuid, text, date, time, text, boolean, text, text)
  to service_role;

-- One atomic save for settings, sessions, and closed dates.
create or replace function public.save_clinic_settings(
  p_settings jsonb,
  p_sessions jsonb,
  p_closed_dates jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('doctor', 'admin') then
    raise exception 'Not allowed';
  end if;

  -- Remove old sessions before a possible slot-length change is validated.
  -- Supabase's safe-update guard requires an explicit WHERE even in functions.
  delete from public.doctor_sessions where true;

  insert into public.doctor_settings (
    id, approval_mode, paymob_enabled, fawry_enabled, open_days,
    work_start, work_end, slot_minutes, hold_minutes,
    cancel_hours_before, timezone
  )
  values (
    'clinic',
    coalesce((p_settings ->> 'approval_mode')::public.approval_mode, 'pay_at_clinic_auto_confirmed'),
    coalesce((p_settings ->> 'paymob_enabled')::boolean, false),
    coalesce((p_settings ->> 'fawry_enabled')::boolean, false),
    array(select jsonb_array_elements_text(p_settings -> 'open_days'))::integer[],
    nullif(p_settings ->> 'work_start', '')::time,
    nullif(p_settings ->> 'work_end', '')::time,
    (p_settings ->> 'slot_minutes')::integer,
    (p_settings ->> 'hold_minutes')::integer,
    (p_settings ->> 'cancel_hours_before')::integer,
    coalesce(nullif(p_settings ->> 'timezone', ''), 'Africa/Cairo')
  )
  on conflict (id) do update set
    approval_mode = excluded.approval_mode,
    paymob_enabled = excluded.paymob_enabled,
    fawry_enabled = excluded.fawry_enabled,
    open_days = excluded.open_days,
    work_start = excluded.work_start,
    work_end = excluded.work_end,
    slot_minutes = excluded.slot_minutes,
    hold_minutes = excluded.hold_minutes,
    cancel_hours_before = excluded.cancel_hours_before,
    timezone = excluded.timezone;

  insert into public.doctor_sessions (scope, scope_key, start_time, end_time, patient_limit)
  select
    (r ->> 'scope')::public.session_scope,
    nullif(r ->> 'scope_key', ''),
    (r ->> 'start_time')::time,
    (r ->> 'end_time')::time,
    (r ->> 'patient_limit')::integer
  from jsonb_array_elements(p_sessions) as r;

  delete from public.doctor_closed_dates where true;
  insert into public.doctor_closed_dates (appointment_date)
  select (r ->> 'date')::date
  from jsonb_array_elements(p_closed_dates) as r;

  return true;
end;
$$;

revoke all on function public.save_clinic_settings(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_clinic_settings(jsonb, jsonb, jsonb) to authenticated;

alter table public.doctor_sessions enable row level security;
alter table public.doctor_closed_dates enable row level security;

revoke all on public.doctor_sessions from anon, authenticated;
revoke all on public.doctor_closed_dates from anon, authenticated;
grant select, insert, update, delete on public.doctor_sessions to authenticated;
grant select, insert, update, delete on public.doctor_closed_dates to authenticated;

create policy "doctor manages sessions"
  on public.doctor_sessions for all to authenticated
  using (public.current_role() in ('doctor', 'admin'))
  with check (public.current_role() in ('doctor', 'admin'));

create policy "doctor manages closed dates"
  on public.doctor_closed_dates for all to authenticated
  using (public.current_role() in ('doctor', 'admin'))
  with check (public.current_role() in ('doctor', 'admin'));

-- Preserve any work hours that were configured before this migration.
insert into public.doctor_sessions (scope, start_time, end_time, patient_limit)
select
  'default',
  d.work_start,
  d.work_end,
  greatest(
    1,
    floor(extract(epoch from (d.work_end - d.work_start)) / 60 / d.slot_minutes)::integer
  )
from public.doctor_settings d
where d.id = 'clinic'
  and d.work_start is not null
  and d.work_end is not null
  and not exists (select 1 from public.doctor_sessions);
