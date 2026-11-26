// Supabase Edge Function: release-expired-holds
// Schedule with an external cron or Supabase Cron to run every few minutes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const { data: settings } = await admin
    .from('doctor_settings')
    .select('hold_minutes')
    .eq('id', 'clinic')
    .maybeSingle();

  if (!settings) {
    return new Response(JSON.stringify({ error: 'Settings missing.' }), {
      status: 500,
    });
  }

  const cutoff = new Date(
    Date.now() - settings.hold_minutes * 60 * 1000
  ).toISOString();

  const { data, error } = await admin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('status', 'awaiting_payment')
    .lt('created_at', cutoff)
    .select('id');

  return new Response(
    JSON.stringify({ released: error ? 0 : data?.length ?? 0, error }),
    { status: error ? 500 : 200 }
  );
});
