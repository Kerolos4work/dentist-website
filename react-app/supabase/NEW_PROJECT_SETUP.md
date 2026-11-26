# Switching to the new Supabase project

Target project ref: `udobxqnafphnzjprlbba`

The app's `.env.local` points to this project. The new project is empty, so it must be provisioned before the site will work against it.

## 1. Apply migrations

Run these in the Supabase SQL editor, in order:

```text
supabase/migrations/0001_appointments.sql
supabase/migrations/0002_sessions.sql
supabase/migrations/0003_guest_booking.sql
supabase/migrations/0004_queue_booking.sql
supabase/migrations/0006_guest_lookup_all.sql
supabase/migrations/0007_patient_auth.sql
```

Skip `0005_dummy_sessions.sql`. Enter verified clinic sessions in `/dashboard/settings` instead.

## 2. Deploy Edge Functions

```bash
npx supabase functions deploy create-booking payment-webhook release-expired-holds
```

Set the project secrets with `npx supabase secrets set`:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PAYMOB_API_KEY
PAYMOB_INTEGRATION_ID
PAYMOB_HMAC_SECRET
FAWRY_MERCHANT_CODE
FAWRY_SECRET_KEY
FAWRY_HMAC_SECRET
SITE_URL
```

## 3. Configure Google Auth

Google is currently disabled on the new project.

1. In Google Cloud, set the authorized redirect URI to:
   ```text
   https://udobxqnafphnzjprlbba.supabase.co/auth/v1/callback
   ```
2. In Supabase Auth → Providers, enable Google with that client's ID and secret.
3. Add these redirect URLs:
   ```text
   http://localhost:3000/auth/callback
   https://<production-domain>/auth/callback
   ```
4. Set the Supabase Site URL to the production domain.

Patient and staff sign-in both use this provider. They are separated by the `audience` parameter in `/auth/callback` and by the database role check.

## 4. Assign staff roles

After a verified staff member signs in once, update their profile:

```sql
update public.profiles
set role = 'doctor' -- or 'nurse' / 'admin'
where id = (
  select id from auth.users where email = 'verified-staff@example.com'
);
```

Google login by itself never grants dashboard access.

## 5. Data migration

The old project contains five real bookings. If they must be preserved, migrate appointments with their `booking_reference`, then advance `booking_reference_seq` past the highest imported reference. Do not copy `profiles` rows directly; auth user IDs differ.

## CLI access note

`kerolos4work@gmail.com` cannot currently link the CLI to `udobxqnafphnzjprlbba`:

```text
LinkProjectStatusError: Your account does not have the necessary privileges
```

An organization admin must grant access, or the SQL and function deployment must be done from a signed-in Supabase dashboard session with access to this project.
