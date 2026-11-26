// Supabase Edge Function: create-booking
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMOB_API_KEY,
// PAYMOB_INTEGRATION_ID, FAWRY_MERCHANT_CODE, FAWRY_SECRET_KEY, SITE_URL.
//
// The client never sends a price. The fee is fixed in the database at 300 EGP.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const serviceIds = new Set([
  'full-arch',
  'veneers-and-smile-design',
  'implants',
  'root-canal',
  'orthodontics',
  'periodontics',
  'pediatric',
  'prosthodontics',
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function bookingError(message: string) {
  if (message.includes('Session is full')) {
    return 'الجلسة مكتملة. اختر وقتًا آخر.';
  }
  if (message.includes('Slot is taken')) {
    return 'تم حجز هذا الوقت للتو. اختر وقتًا آخر.';
  }
  if (message.includes('Time is outside working hours')) {
    return 'الوقت خارج أوقات عمل العيادة.';
  }
  if (message.includes('Unknown service')) {
    return 'التخصص غير معروف.';
  }
  return message;
}

async function paymobSession(amountCents: number, merchantRef: string) {
  const key = Deno.env.get('PAYMOB_API_KEY');
  const integration = Deno.env.get('PAYMOB_INTEGRATION_ID');
  if (!key || !integration) {
    throw new Error('Paymob is not configured on the server.');
  }

  const auth = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key }),
  }).then((response) => response.json());

  const order = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: auth.token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantRef,
      items: [],
    }),
  }).then((response) => response.json());

  const paymentKey = await fetch(
    'https://accept.paymob.com/api/acceptance/payment_keys',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: auth.token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: order.id,
        billing_data: {
          apartment: 'NA',
          email: 'patient@clinic.local',
          first_name: 'Clinic',
          last_name: 'Patient',
          phone_number: 'NA',
          city: 'Cairo',
          country: 'EG',
          street: 'NA',
          building: 'NA',
          postal_code: 'NA',
        },
        currency: 'EGP',
        integration_id: Number(integration),
      }),
    }
  ).then((response) => response.json());

  return {
    redirectUrl: `https://accept.paymob.com/api/acceptance/iframe/${paymentKey.token}`,
    reference: String(order.id),
  };
}

async function fawrySession(amount: number, merchantRef: string, phone: string) {
  const merchantCode = Deno.env.get('FAWRY_MERCHANT_CODE');
  const secret = Deno.env.get('FAWRY_SECRET_KEY');
  const siteUrl = Deno.env.get('SITE_URL') ?? '';
  if (!merchantCode || !secret) {
    throw new Error('Fawry is not configured on the server.');
  }

  // Confirm the exact signature string against the Fawry merchant dashboard
  // before enabling this provider in production.
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${merchantCode}${merchantRef}${amount}EGP${secret}`)
  );
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const response = await fetch(
    'https://www.fawry.io/api/merchant-online-v2/createCharge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantCode,
        merchantRefNumber: merchantRef,
        amount,
        currencyCode: 'EGP',
        customerName: 'Clinic Patient',
        customerMobile: phone || '01000000000',
        customerEmail: 'patient@clinic.local',
        customerProfileId: merchantRef,
        paymentMethod: 'CARD',
        paymentExpiryDate: Date.now() + 15 * 60 * 1000,
        chargeItems: [
          {
            itemId: 'exam',
            description: 'Kashf',
            amount,
          },
        ],
        returnUrl: `${siteUrl}/my-appointments`,
        signature,
      }),
    }
  ).then((result) => result.json());

  return {
    redirectUrl: response.redirectUrl as string,
    reference: merchantRef,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'Missing session.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Invalid session.' }, 401);

  let body: {
    serviceId?: string;
    date?: string;
    time?: string;
    note?: string;
    provider?: 'paymob' | 'fawry';
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const { data: settings } = await admin
    .from('doctor_settings')
    .select('*')
    .eq('id', 'clinic')
    .maybeSingle();
  if (!settings) return json({ error: 'Clinic settings are missing.' }, 500);

  const serviceId = body.serviceId ?? '';
  if (!serviceIds.has(serviceId)) return json({ error: 'Unknown service.' }, 400);
  if (!body.date || !body.time) return json({ error: 'Date and time are required.' }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !/^\d{2}:\d{2}$/.test(body.time)) {
    return json({ error: 'Invalid date or time.' }, 400);
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('phone, full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  const needsPayment = settings.approval_mode === 'auto_after_payment';
  const provider = needsPayment ? body.provider : null;
  if (
    needsPayment &&
    (!provider ||
      (provider === 'paymob' && !settings.paymob_enabled) ||
      (provider === 'fawry' && !settings.fawry_enabled))
  ) {
    return json({ error: 'Payment provider is not available.' }, 400);
  }

  const merchantRef = crypto.randomUUID();
  // The RPC locks the date, checks the effective session quota and slot, and
  // inserts the appointment in one transaction. No client-side schedule logic
  // can bypass it.
  const { data: appointment, error: bookingErrorResponse } = await admin.rpc(
    'create_appointment',
    {
      p_patient: authData.user.id,
      p_service_id: serviceId,
      p_date: body.date,
      p_time: body.time,
      p_note: body.note ?? '',
      p_needs_payment: needsPayment,
      p_provider: provider ?? null,
      p_reference: merchantRef,
    }
  );

  if (bookingErrorResponse || !appointment?.length) {
    const detail = bookingErrorResponse?.message ?? 'Booking failed.';
    const conflict =
      detail.includes('Session is full') ||
      detail.includes('Slot is taken') ||
      detail.includes('Time is outside working hours');
    return json({ error: bookingError(detail) }, conflict ? 409 : 400);
  }

  const booked = appointment[0];

  if (!needsPayment) {
    return json({ appointmentId: booked.out_id, status: booked.out_status });
  }

  try {
    const session =
      provider === 'paymob'
        ? await paymobSession(30000, merchantRef)
        : await fawrySession(300, merchantRef, profile?.phone ?? '');
    return json({
      appointmentId: booked.out_id,
      redirectUrl: session.redirectUrl,
      reference: session.reference,
    });
  } catch (error) {
    // Never leave a paid-looking hold when the gateway could not start.
    await admin
      .from('appointments')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', booked.out_id);
    return json(
      { error: error instanceof Error ? error.message : 'Payment setup failed.' },
      502
    );
  }
});
