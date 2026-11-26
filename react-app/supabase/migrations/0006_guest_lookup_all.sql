-- Guests may have more than one reservation on the same phone number.
-- Return every matching booking (newest first), with the reference as an
-- optional exact filter.

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
  if v_phone is null then
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
  where (v_reference = '' or a.booking_reference = v_reference)
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
  limit 20;
end;
$$;

revoke all on function public.guest_lookup_appointment(text, text) from public, anon, authenticated;
grant execute on function public.guest_lookup_appointment(text, text) to anon, authenticated;
