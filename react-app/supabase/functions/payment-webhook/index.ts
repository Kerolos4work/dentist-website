// Supabase Edge Function: payment-webhook?provider=paymob|fawry
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMOB_HMAC_SECRET,
// FAWRY_HMAC_SECRET.
//
// Only a verified signature can confirm a booking. The client can never call
// this endpoint to approve itself.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*' };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function hmacMatches(secret: string, message: string, expected: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const actual = Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) {
    mismatch |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const provider = new URL(req.url).searchParams.get('provider');
  if (provider !== 'paymob' && provider !== 'fawry') {
    return json({ error: 'Unknown provider.' }, 400);
  }

  const secret = Deno.env.get(
    provider === 'paymob' ? 'PAYMOB_HMAC_SECRET' : 'FAWRY_HMAC_SECRET'
  );
  if (!secret) return json({ error: 'Webhook secret is missing.' }, 500);

  const signature = req.headers.get(
    provider === 'paymob' ? 'x-paymob-signature' : 'x-fawry-signature'
  );
  const raw = await req.text();
  if (!signature || !(await hmacMatches(secret, raw, signature))) {
    return json({ error: 'Invalid signature.' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid body.' }, 400);
  }

  const obj = (payload.obj ?? {}) as Record<string, unknown>;
  const order = (obj.order ?? {}) as Record<string, unknown>;
  const merchantRef =
    provider === 'paymob'
      ? String(
          order.merchant_order_id ??
            order.merchant_order ??
            payload.merchantRefNumber ??
            ''
        )
      : String(payload.merchantRefNumber ?? '');

  const paid =
    provider === 'paymob'
      ? obj.success === true || obj.success === 'true'
      : payload.paymentStatus === 'PAID' || payload.status === 'PAID';

  if (!merchantRef) return json({ error: 'Missing reference.' }, 400);
  if (!paid) return json({ received: true, confirmed: false });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const { data: appointment, error: findError } = await admin
    .from('appointments')
    .select('id, status')
    .eq('payment_reference', merchantRef)
    .maybeSingle();

  if (findError || !appointment) {
    return json({ error: 'Unknown appointment.' }, 404);
  }

  if (appointment.status !== 'awaiting_payment') {
    return json({ received: true, confirmed: false, reason: 'Already handled.' });
  }

  const { error: updateError } = await admin
    .from('appointments')
    .update({ status: 'confirmed', payment_status: 'paid' })
    .eq('id', appointment.id)
    .eq('status', 'awaiting_payment');

  if (updateError) return json({ error: 'Update failed.' }, 500);

  await admin.from('payments').upsert(
    {
      appointment_id: appointment.id,
      provider,
      provider_txn_id: merchantRef,
      amount: 300,
      currency: 'EGP',
      status: 'paid',
      raw: payload,
    },
    { onConflict: 'provider,provider_txn_id', ignoreDuplicates: true }
  );

  return json({ received: true, confirmed: true });
});
