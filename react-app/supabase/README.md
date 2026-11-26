# Appointment backend

The appointment UI works without credentials in a read-only “not configured” state. To go live:

1. Copy `.env.example` to `.env.local` and fill the Supabase URL, publishable key (or legacy anon key), clinic Workspace domain, and site URL. `proxy.ts` refreshes sessions on each request. Add the same values to Supabase Edge Function secrets with `supabase secrets set`.
2. Apply `migrations/0001_appointments.sql` with `supabase db push` or in the Supabase SQL editor.
3. In Supabase Auth, enable Google and Microsoft (Azure) providers. Add `http://localhost:3000/auth/callback` and the production equivalent as redirect URLs.
4. Promote staff accounts in `public.profiles`: update `role` to `nurse`, `doctor`, or `admin` only for verified Workspace emails. Patients stay `patient`.
5. Deploy the functions: `supabase functions deploy create-booking payment-webhook release-expired-holds`.
6. Set Paymob/Fawry credentials and webhook secrets. Point each provider's webhook at `/functions/v1/payment-webhook?provider=paymob` or `?provider=fawry`.
7. Log in as the doctor and set approval mode, enabled providers, working days, and hours in `/dashboard/settings`. Until hours are set, patients see “no times available”.
8. Schedule `release-expired-holds` every few minutes (Supabase Cron or an external scheduler).

## Security notes

- Clients cannot insert appointments directly; RLS denies INSERT. All bookings go through `create-booking`, which validates settings, slots, and the fixed 300 EGP fee.
- Clients may only update `status` (to cancel their own booking) or a nurse may update `status`/`nurse_note`. Column grants and RLS both apply.
- Payment confirmation comes only from a signed webhook. `payment-webhook` is idempotent and only moves `awaiting_payment → confirmed`.
- Staff dashboard access requires both an email on the clinic Workspace domain and a staff role; the check runs in `/auth/callback`.
- `booking_config` is a column-limited view so patients cannot read internal hold/cancellation rules.
- Confirm Fawry's exact signature string and Paymob's callback field names against the live merchant dashboards before enabling either provider. The webhook code uses the documented HMAC-over-body contract.
