# Appointment backend

The appointment UI works without credentials in a read-only “not configured” state. To go live:

1. Copy `.env.example` to `.env.local` and fill the Supabase URL, publishable key (or legacy anon key), site URL, and optional clinic Workspace domain. `proxy.ts` refreshes sessions on each request. Add the same values to Supabase Edge Function secrets with `supabase secrets set`.
2. Apply the migrations in order: `0001_appointments.sql`, `0002_sessions.sql`, `0003_guest_booking.sql`, `0004_queue_booking.sql`, `0006_guest_lookup_all.sql`, `0007_patient_auth.sql`. Do not apply `0005_dummy_sessions.sql` to production; configure real clinic sessions instead.
3. In Supabase Auth, enable Google only. Add `http://localhost:3000/auth/callback` and the production equivalent as redirect URLs. The Google client redirect URI must be `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Patient sign-in is optional and lives on `/appointments` and `/my-appointments`. Staff sign-in lives only on `/dashboard` and requires a `nurse`, `doctor`, or `admin` role in `public.profiles`. If `NEXT_PUBLIC_CLINIC_DOMAIN` is set, the staff email domain is checked as well.
5. Promote staff accounts in `public.profiles` only after verifying their Google identity. Patients stay `patient`.
6. Deploy the functions: `supabase functions deploy create-booking payment-webhook release-expired-holds`.
7. Set Paymob/Fawry credentials and webhook secrets. Point each provider's webhook at `/functions/v1/payment-webhook?provider=paymob` or `?provider=fawry`.
8. Log in as the doctor and set approval mode, enabled providers, working days, and sessions in `/dashboard/settings`. Until sessions are set, patients see “no times available”.
9. Schedule `release-expired-holds` every few minutes (Supabase Cron or an external scheduler).

## Security notes

- Clients cannot insert appointments directly; RLS denies INSERT. All bookings go through `create-booking`, which validates settings, sessions, and the fixed 300 EGP fee.
- Guest booking remains the default. A signed-in patient's access token is verified by the Edge Function before the booking is linked to that account.
- An existing guest booking can be claimed only with the matching booking reference and normalized phone. Email alone never links a booking.
- Patients can cancel only their own bookings, and `patient_cancel_appointment` enforces the same `cancel_hours_before` rule as guest cancellation.
- Clients may only update `status` (to cancel their own booking) or a nurse may update `status`/`nurse_note`. Column grants and RLS both apply.
- Payment confirmation comes only from a signed webhook. `payment-webhook` is idempotent and only moves `awaiting_payment → confirmed`.
- Staff dashboard access requires a verified database role; Google login alone never grants staff access. The optional domain check is not an access rule by itself.
- `dr.adel.yousry@gmail.com` is blocked from staff and patient sign-in. The callback checks the verified Google email, and existing sessions are ignored by the app; the booking function and patient RPCs repeat the check.
- `booking_config` is a column-limited view so patients cannot read internal hold/cancellation rules.
- Confirm Fawry's exact signature string and Paymob's callback field names against the live merchant dashboards before enabling either provider. The webhook code uses the documented HMAC-over-body contract.
