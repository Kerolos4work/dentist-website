'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import { appointmentServices } from '@/lib/appointments/services';
import { todayIso } from '@/lib/appointments/slots';
import type { BookingConfig, PaymentProvider } from '@/lib/appointments/types';
import styles from '../booking.module.css';

type Props = {
  config: BookingConfig | null;
};

type Confirmation = {
  reference: string;
  service: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
};

type BookingResponse = {
  bookingReference?: string;
  status?: string;
  paymentStatus?: string;
  redirectUrl?: string;
  error?: string;
};

async function functionErrorMessage(error: unknown): Promise<string> {
  const response = (error as { context?: Response } | null)?.context;
  if (response) {
    try {
      const body = (await response.json()) as BookingResponse;
      if (body.error) return body.error;
    } catch {
      // Fall through to the generic message below.
    }
  }

  const message = (error as { message?: string } | null)?.message ?? '';
  if (message && /[\u0600-\u06FF]/.test(message)) return message;
  return 'تعذّر إتمام الحجز. حاول لاحقًا.';
}

export default function BookingForm({ config }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceId, setServiceId] = useState(appointmentServices[0].id);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  // Availability comes from the database so session quotas and one-off
  // closures are applied at the same place that enforces them on booking.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase || !date) {
      setSlots([]);
      setSlotsLoading(false);
      return;
    }

    let active = true;
    setSlots([]);
    setSlotsLoading(true);
    void supabase
      .rpc('booking_available_slots', { p_date: date })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSlots([]);
          setStatus('تعذّر تحميل الأوقات المتاحة. حاول لاحقًا.');
        } else {
          setSlots(
            ((data ?? []) as { slot: string }[]).map((row) => row.slot.slice(0, 5))
          );
        }
        setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [date]);

  const needsPayment = config?.approval_mode === 'auto_after_payment';
  const availableProviders = [
    config?.paymob_enabled ? 'paymob' : null,
    config?.fawry_enabled ? 'fawry' : null,
  ].filter(Boolean) as PaymentProvider[];

  const selectedService =
    appointmentServices.find((service) => service.id === serviceId) ??
    appointmentServices[0];

  async function submit() {
    if (confirmation) return;

    if (fullName.trim().length < 2) {
      setStatus('اكتب اسمك كاملًا.');
      return;
    }
    if (!phone.trim()) {
      setStatus('اكتب رقم الهاتف.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('البريد الإلكتروني غير صالح.');
      return;
    }
    if (!time) {
      setStatus('اختر وقتًا من الأوقات المتاحة.');
      return;
    }
    if (needsPayment && !provider) {
      setStatus('اختر وسيلة الدفع.');
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    const { data, error } = await supabase.functions.invoke('create-booking', {
      body: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        serviceId,
        date,
        time,
        note,
        provider,
      },
    });

    if (error) {
      setStatus(await functionErrorMessage(error));
      setBusy(false);
      return;
    }

    const booked = data as BookingResponse;
    if (booked.error) {
      setStatus(booked.error);
      setBusy(false);
      return;
    }

    setConfirmation({
      reference: booked.bookingReference ?? '',
      service: selectedService.label,
      date,
      time,
      status: booked.status === 'awaiting_payment' ? 'بانتظار الدفع' : 'مؤكد',
      paymentStatus: booked.paymentStatus === 'due_at_clinic' ? 'يدفع في العيادة' : 'جارٍ الدفع',
    });

    if (booked.redirectUrl) {
      window.location.assign(booked.redirectUrl);
      return;
    }
    setBusy(false);
  }

  if (!config) {
    return (
      <div className={styles.card}>
        <p className={`${styles.message} ${styles.error}`}>
          الحجوزات الإلكترونية غير مفعّلة بعد. اتصل بالعيادة مباشرة.
        </p>
        <div className={styles.actions}>
          <a href="tel:+201285827427" className={styles.primary} dir="ltr">
            +20 12 85827427
          </a>
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>تم تسجيل طلبك</h2>
        <p className={styles.cardNote}>
          احتفظ برقم الحجز، واستخدم الاسم ورقم الهاتف اللذين أدخلتهما عند الحجز.
        </p>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>رقم الحجز</span>
            <b dir="ltr">{confirmation.reference}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>التخصص</span>
            <b>{confirmation.service}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>اليوم</span>
            <b dir="ltr">{confirmation.date}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>الوقت</span>
            <b dir="ltr">{confirmation.time}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>الحالة</span>
            <b>{confirmation.status}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>الدفع</span>
            <b>{confirmation.paymentStatus}</b>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/my-appointments" className={styles.primary}>
            تابع موعدك
          </Link>
          <Link href="/appointments" className={styles.ghost}>
            حجز جديد
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>بيانات المريض</h2>
        <p className={styles.cardNote}>
          لا تحتاج إلى حساب. نستخدم الاسم ورقم الهاتف لمتابعة حجزك وإلغائه.
        </p>

        {status ? <p className={`${styles.message} ${styles.error}`}>{status}</p> : null}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="fullName">
            الاسم
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            className={styles.input}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="الاسم كما يظهر في جواز السفر أو الهوية"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            رقم الهاتف
          </label>
          <input
            id="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            required
            className={styles.input}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+20 12 85827427"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            البريد الإلكتروني (اختياري)
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </div>

        <h2 className={styles.cardTitle}>تفاصيل الموعد</h2>
        <p className={styles.cardNote}>
          الأوقات المعروضة من إعدادات العيادة. لا يمكن حجز أكثر من مريض في نفس
          الوقت.
        </p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="service">
            التخصص
          </label>
          <select
            id="service"
            className={styles.select}
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            {appointmentServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="date">
            اليوم
          </label>
          <input
            id="date"
            type="date"
            min={todayIso()}
            className={styles.input}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setTime('');
            }}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>الوقت المتاح</span>
          {slots.length ? (
            <div className={styles.slotGrid}>
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`${styles.slot} ${
                    time === slot ? styles.slotActive : ''
                  }`}
                  onClick={() => setTime(slot)}
                >
                  <span dir="ltr">{slot}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.message}>
              {slotsLoading
                ? 'جارٍ تحميل الأوقات المتاحة…'
                : 'لا توجد أوقات متاحة لهذا اليوم.'}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="note">
            ملاحظة للعيادة (اختياري)
          </label>
          <textarea
            id="note"
            className={styles.textarea}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="لا تكتب بيانات طبية أو تحاليل هنا"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={
              busy ||
              fullName.trim().length < 2 ||
              !phone.trim() ||
              !time ||
              (needsPayment && !provider)
            }
            onClick={() => void submit()}
          >
            {busy ? 'جارٍ الإرسال…' : needsPayment ? 'ادفع وأكّد' : 'تأكيد الحجز'}
          </button>
        </div>
      </div>

      <aside className={styles.card}>
        <h2 className={styles.cardTitle}>ملخص</h2>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>المريض</span>
            <b>{fullName.trim() || '—'}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>التخصص</span>
            <b>{selectedService.label}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>الكشف</span>
            <b dir="ltr">300 EGP</b>
          </div>
          <div className={styles.summaryRow}>
            <span>الوقت</span>
            <b dir="ltr">
              {date} {time}
            </b>
          </div>
          <div className={styles.summaryRow}>
            <span>النوع</span>
            <b>
              {needsPayment ? 'دفع إلكتروني ثم تأكيد' : 'دفع في العيادة'}
            </b>
          </div>

          {needsPayment ? (
            <div className={styles.field}>
              <span className={styles.label}>وسيلة الدفع</span>
              <div className={styles.providerRow}>
                <button
                  type="button"
                  className={`${styles.provider} ${
                    provider === 'paymob' ? styles.providerActive : ''
                  }`}
                  disabled={!config.paymob_enabled}
                  onClick={() => setProvider('paymob')}
                >
                  Paymob
                </button>
                <button
                  type="button"
                  className={`${styles.provider} ${
                    provider === 'fawry' ? styles.providerActive : ''
                  }`}
                  disabled={!config.fawry_enabled}
                  onClick={() => setProvider('fawry')}
                >
                  Fawry
                </button>
              </div>
              {!availableProviders.length ? (
                <p className={`${styles.message} ${styles.error}`}>
                  لم يُفعّل أي مزود دفع. تواصل مع العيادة.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
