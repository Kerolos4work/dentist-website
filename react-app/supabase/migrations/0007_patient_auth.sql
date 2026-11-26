-- Optional patient accounts. Guest booking stays the default; these RPCs only
-- run for an authenticated Supabase user and never trust a client-supplied ID.

-- Attach an existing guest booking to the signed-in patient, but only when the
-- booking reference and normalized phone match. Email is never used for linking.
drop function if exists public.claim_guest_appointment(text, text);

create or replace function public.claim_guest_appointment(
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
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reference text := upper(btrim(coalesce(p_reference, '')));
  v_phone text := public.normalize_phone(p_phone);
  v_appointment record;
begin
  if v_user is null then
    raise exception 'سجّل الدخول أولًا.';
  end if;

  if v_reference = '' or v_phone is null then
    raise exception 'بيانات البحث غير صحيحة.';
  end if;

  select a.*
    into v_appointment
  from public.appointments a
  where a.booking_reference = v_reference
    and a.patient_phone = v_phone
  order by a.created_at desc
  limit 1;

  if not found then
    raise exception 'لم نعثر على حجز بهذا الرقم ورقم الهاتف.';
  end if;

  if v_appointment.patient_id is not null and v_appointment.patient_id <> v_user then
    raise exception 'هذا الحجز مرتبط بحساب آخر.';
  end if;

  if v_appointment.patient_id is null then
    update public.appointments
    set patient_id = v_user
    where id = v_appointment.id
      and patient_id is null;

    if not found then
      raise exception 'هذا الحجز مرتبط بحساب آخر.';
    end if;
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
  where a.id = v_appointment.id;
end;
$$;

-- Patient cancellation uses the same grace period as guest cancellation.
drop function if exists public.patient_cancel_appointment(uuid);

create or replace function public.patient_cancel_appointment(p_appointment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_appointment record;
  v_timezone text;
  v_cancel_hours integer;
begin
  if v_user is null then
    raise exception 'سجّل الدخول أولًا.';
  end if;

  select a.*
    into v_appointment
  from public.appointments a
  where a.id = p_appointment_id
    and a.patient_id = v_user;

  if not found then
    raise exception 'لا يمكنك إلغاء هذا الحجز.';
  end if;

  if v_appointment.status not in ('awaiting_payment', 'needs_review', 'confirmed') then
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

revoke all on function public.claim_guest_appointment(text, text) from public, anon, authenticated;
grant execute on function public.claim_guest_appointment(text, text) to authenticated;

revoke all on function public.patient_cancel_appointment(uuid) from public, anon, authenticated;
grant execute on function public.patient_cancel_appointment(uuid) to authenticated;
