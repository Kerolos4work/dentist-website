// Supabase Edge Function: create-booking
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMOB_API_KEY,
// PAYMOB_INTEGRATION_ID, FAWRY_MERCHANT_CODE, FAWRY_SECRET_KEY, SITE_URL.
//
// Guests book with a name and phone only. The client never sends a price:
// the fee is fixed in the database at 300 EGP.

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

type Provider = 'paymob' | 'fawry';

type BookingBody = {
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  serviceId?: unknown;
  date?: unknown;
  time?: unknown;
  note?: unknown;
  provider?: unknown;
};

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
  if (message.includes('You already have an appointment on this day')) {
    return 'لديك حجز بالفعل في هذا اليوم.';
  }
  if (message.includes('Date is in the past')) {
    return 'لا يمكن حجز موعد في تاريخ سابق.';
  }
  if (message.includes('Unknown service')) {
    return 'التخصص غير معروف.';
  }
  if (message.includes('Invalid patient name')) {
    return 'الاسم غير صالح.';
  }
  if (message.includes('Invalid phone')) {
    return 'رقم الهاتف غير صالح.';
  }
  if (message.includes('Invalid email')) {
    return 'البريد الإلكتروني غير صالح.';
  }
  if (message.includes('Clinic settings are missing')) {
    return 'إعدادات العيادة غير متاحة حاليًا.';
  }
  return 'تعذّر إتمام الحجز. حاول لاحقًا.';
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660)
    )
    .replace(/[\u06F0-\u06F9]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x06F0)
    );
  const digits = normalized.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) {
    return `+20${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+20${digits.slice(1)}`;
  }
  if (digits.length === 9 && !digits.startsWith('0')) {
    return `+20${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('20')) {
    return `+${digits}`;
  }
  if (digits.length === 14 && digits.startsWith('0020')) {
    return `+${digits.slice(2)}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function paymobSession(
  amountCents: number,
  merchantRef: string,
  guest: { name: string; phone: string; email: string }
) {
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

  const nameParts = guest.name.split(/\s+/);
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
          email: guest.email || 'patient@clinic.local',
          first_name: nameParts[0] || 'Patient',
          last_name: nameParts.slice(1).join(' ') || 'Clinic',
          phone_number: guest.phone.replace(/\D/g, '') || '01000000000',
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

async function fawrySession(
  amount: number,
  merchantRef: string,
  guest: { name: string; phone: string; email: string }
) {
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
        customerName: guest.name,
        customerMobile: guest.phone.replace(/\D/g, '') || '01000000000',
        customerEmail: guest.email || 'patient@clinic.local',
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'إعدادات الخادم غير مكتملة.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  let body: BookingBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'طلب غير صالح.' }, 400);
  }

  const fullName = cleanText(body.fullName, 80);
  const phone = normalizePhone(body.phone);
  const email = cleanText(body.email, 320).toLowerCase();
  const serviceId = cleanText(body.serviceId, 64);
  const date = cleanText(body.date, 10);
  const time = cleanText(body.time, 5);
  const note = cleanText(body.note, 500);

  if (fullName.length < 2) {
    return json({ error: 'الاسم غير صالح.' }, 400);
  }
  if (!phone) {
    return json({ error: 'رقم الهاتف غير صالح.' }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'البريد الإلكتروني غير صالح.' }, 400);
  }
  if (!serviceIds.has(serviceId)) {
    return json({ error: 'التخصص غير معروف.' }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return json({ error: 'اليوم والوقت غير صالحين.' }, 400);
  }

  const { data: settings } = await admin
    .from('doctor_settings')
    .select('*')
    .eq('id', 'clinic')
    .maybeSingle();
  if (!settings) {
    return json({ error: 'إعدادات العيادة غير متاحة حاليًا.' }, 500);
  }

  const needsPayment = settings.approval_mode === 'auto_after_payment';
  let provider: Provider | null = null;
  if (needsPayment) {
    if (body.provider !== 'paymob' && body.provider !== 'fawry') {
      return json({ error: 'اختر وسيلة الدفع.' }, 400);
    }
    if (
      (body.provider === 'paymob' && !settings.paymob_enabled) ||
      (body.provider === 'fawry' && !settings.fawry_enabled)
    ) {
      return json({ error: 'وسيلة الدفع غير متاحة حاليًا.' }, 400);
    }
    provider = body.provider;
  }

  const merchantRef = crypto.randomUUID();
  // The RPC locks the date, checks the effective session quota and slot, and
  // inserts the appointment in one transaction. No client-side schedule logic
  // can bypass it.
  const { data: appointment, error: bookingErrorResponse } = await admin.rpc(
    'create_guest_appointment',
    {
      p_full_name: fullName,
      p_phone: phone,
      p_email: email || null,
      p_service_id: serviceId,
      p_date: date,
      p_time: time,
      p_note: note,
      p_needs_payment: needsPayment,
      p_provider: provider,
      p_payment_reference: merchantRef,
    }
  );

  if (bookingErrorResponse || !appointment?.length) {
    const detail = bookingErrorResponse?.message ?? 'Booking failed.';
    const conflict =
      detail.includes('Session is full') ||
      detail.includes('Slot is taken') ||
      detail.includes('Time is outside working hours') ||
      detail.includes('You already have an appointment on this day');
    return json({ error: bookingError(detail) }, conflict ? 409 : 400);
  }

  const booked = appointment[0];
  const booking = {
    appointmentId: booked.out_id,
    bookingReference: booked.out_booking_reference,
    status: booked.out_status,
    paymentStatus: booked.out_payment_status,
  };

  if (!needsPayment) {
    return json(booking);
  }

  const guest = { name: fullName, phone, email };
  try {
    const session =
      provider === 'paymob'
        ? await paymobSession(30000, merchantRef, guest)
        : await fawrySession(300, merchantRef, guest);
    return json({
      ...booking,
      redirectUrl: session.redirectUrl,
      paymentReference: session.reference,
    });
  } catch (error) {
    // Never leave a paid-looking hold when the gateway could not start.
    await admin
      .from('appointments')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', booked.out_id);
    return json(
      {
        ...booking,
        status: 'cancelled',
        paymentStatus: 'failed',
        error: 'تعذّر بدء الدفع. حاول لاحقًا.',
      },
      502
    );
  }
});
