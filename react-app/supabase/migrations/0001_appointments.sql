-- Appointment system for Dr. Adel Yousry clinic.
-- Run with: supabase db push   (or paste into the Supabase SQL editor).

create extension if not exists pgcrypto;

create type public.app_role as enum ('patient', 'nurse', 'doctor', 'admin');
create type public.approval_mode as enum (
  'auto_after_payment',
  'pay_at_clinic_auto_confirmed'
);
create type public.payment_provider as enum ('paymob', 'fawry');
create type public.appointment_status as enum (
  'awaiting_payment',
  'needs_review',
  'confirmed',
  'declined',
  'arrived',
  'completed',
  'cancelled'
);
create type public.payment_status as enum (
  'unpaid',
  'awaiting_payment',
  'paid',
  'due_at_clinic',
  'failed',
  'refunded'
);

-- One row per auth user; role is never writable by the user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'patient',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Doctor-controlled settings. open_days uses JS weekday numbers: 0 = Sunday.
create table public.doctor_settings (
  id text primary key check (id = 'clinic'),
  approval_mode public.approval_mode not null default 'pay_at_clinic_auto_confirmed',
  paymob_enabled boolean not null default false,
  fawry_enabled boolean not null default false,
  open_days integer[] not null default '{}',
  work_start time,
  work_end time,
  slot_minutes integer not null default 30 check (slot_minutes between 5 and 180),
  hold_minutes integer not null default 15 check (hold_minutes between 1 and 120),
  cancel_hours_before integer not null default 0 check (cancel_hours_before between 0 and 168),
  timezone text not null default 'Africa/Cairo',
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.doctor_settings (id) values ('clinic');

-- Public-safe projection: patients can read schedule and enabled providers,
-- never internal hold/cancellation rules or who last edited the settings.
create view public.booking_config
with (security_invoker = false)
as
select
  id,
  approval_mode,
  paymob_enabled,
  fawry_enabled,
  open_days,
  work_start,
  work_end,
  slot_minutes,
  timezone,
  hold_minutes
from public.doctor_settings
where id = 'clinic';

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  service_id text not null check (
    service_id in (
      'full-arch',
      'veneers-and-smile-design',
      'implants',
      'root-canal',
      'orthodontics',
      'periodontics',
      'pediatric',
      'prosthodontics'
    )
  ),
  service_label text not null,
  fee_amount integer not null default 300 check (fee_amount = 300),
  currency text not null default 'EGP',
  appointment_date date not null,
  start_time time not null,
  end_time time,
  status public.appointment_status not null default 'awaiting_payment',
  payment_provider public.payment_provider,
  payment_status public.payment_status not null default 'unpaid',
  payment_reference text,
  patient_note text check (char_length(patient_note) <= 500),
  nurse_note text check (char_length(nurse_note) <= 500),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);

-- One active booking per slot. Cancelled/declined/completed rows free the slot.
create unique index one_active_booking_per_slot
  on public.appointments (appointment_date, start_time)
  where status in ('awaiting_payment', 'needs_review', 'confirmed', 'arrived');

create index appointments_patient_idx on public.appointments (patient_id, appointment_date desc);
create index appointments_staff_idx on public.appointments (appointment_date, start_time, status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  provider public.payment_provider not null,
  provider_txn_id text not null,
  amount integer not null default 300 check (amount = 300),
  currency text not null default 'EGP',
  status text not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_txn_id)
);

create table public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  from_status public.appointment_status,
  to_status public.appointment_status,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Security-definer helpers avoid recursive RLS when policies read profiles.
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('nurse', 'doctor', 'admin');
$$;

create or replace function public.log_appointment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.appointment_events
      (appointment_id, actor_id, action, from_status, to_status)
    values
      (new.id, auth.uid(), 'status_change', old.status, new.status);

    if new.status in ('confirmed', 'declined') then
      new.reviewed_by := coalesce(new.reviewed_by, auth.uid());
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;

    if new.status = 'arrived' and new.checked_in_at is null then
      new.checked_in_at := now();
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger appointments_audit
  before update on public.appointments
  for each row execute function public.log_appointment_changes();

create or replace function public.stamp_settings_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create trigger doctor_settings_stamp
  before insert or update on public.doctor_settings
  for each row execute function public.stamp_settings_update();

-- Columns: clients may only write the fields their role is meant to write.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

revoke all on public.appointments from anon, authenticated;
grant select on public.appointments to authenticated;
grant update (status, nurse_note) on public.appointments to authenticated;

revoke all on public.doctor_settings from anon, authenticated;
grant select, insert, update on public.doctor_settings to authenticated;

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

revoke all on public.appointment_events from anon, authenticated;
grant select on public.appointment_events to authenticated;

grant select on public.booking_config to anon, authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_staff() to authenticated;

alter table public.profiles enable row level security;
alter table public.doctor_settings enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.appointment_events enable row level security;

create policy "patients read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "staff reads patient profiles"
  on public.profiles for select to authenticated
  using (
    public.is_staff()
    and exists (
      select 1 from public.appointments a where a.patient_id = public.profiles.id
    )
  );

create policy "users update own profile fields"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "doctor reads settings"
  on public.doctor_settings for select to authenticated
  using (public.current_role() in ('doctor', 'admin'));

create policy "doctor updates settings"
  on public.doctor_settings for update to authenticated
  using (public.current_role() in ('doctor', 'admin'))
  with check (id = 'clinic' and public.current_role() in ('doctor', 'admin'));

create policy "doctor inserts settings"
  on public.doctor_settings for insert to authenticated
  with check (id = 'clinic' and public.current_role() in ('doctor', 'admin'));

create policy "patients read own appointments"
  on public.appointments for select to authenticated
  using (patient_id = auth.uid());

create policy "nurses read all appointments"
  on public.appointments for select to authenticated
  using (public.current_role() in ('nurse', 'admin'));

create policy "doctors read confirmed appointments"
  on public.appointments for select to authenticated
  using (
    public.current_role() = 'doctor'
    and status in ('confirmed', 'arrived', 'completed')
  );

create policy "patients cancel own appointments"
  on public.appointments for update to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid() and status = 'cancelled');

create policy "nurses manage appointments"
  on public.appointments for update to authenticated
  using (public.current_role() in ('nurse', 'admin'))
  with check (public.current_role() in ('nurse', 'admin'));

create policy "patients read own payments"
  on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = public.payments.appointment_id and a.patient_id = auth.uid()
    )
  );

create policy "staff reads payments"
  on public.payments for select to authenticated
  using (public.is_staff());

create policy "patients read own events"
  on public.appointment_events for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = public.appointment_events.appointment_id
        and a.patient_id = auth.uid()
    )
  );

create policy "staff reads events"
  on public.appointment_events for select to authenticated
  using (public.is_staff());
