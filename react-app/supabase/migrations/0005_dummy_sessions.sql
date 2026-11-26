-- Dummy UI data: five selectable doctor sessions per open day.
-- Replace these times with the clinic's real schedule before production.

insert into public.doctor_sessions (scope, scope_key, start_time, end_time, patient_limit)
values
  ('default', null, '08:00', '09:00', 2),
  ('default', null, '12:00', '15:00', 3),
  ('default', null, '15:00', '18:00', 3),
  ('default', null, '18:00', '21:00', 3)
on conflict (scope, coalesce(scope_key, ''), start_time) do nothing;

-- Friday already has a 10:00-13:00 override, so fill out the five Friday options too.
insert into public.doctor_sessions (scope, scope_key, start_time, end_time, patient_limit)
values
  ('weekday', '5', '08:00', '10:00', 3),
  ('weekday', '5', '13:00', '16:00', 3),
  ('weekday', '5', '16:00', '19:00', 3),
  ('weekday', '5', '19:00', '22:00', 3)
on conflict (scope, coalesce(scope_key, ''), start_time) do nothing;
