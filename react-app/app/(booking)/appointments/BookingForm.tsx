'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { appointmentServices } from '@/lib/appointments/services';
import { todayIso } from '@/lib/appointments/slots';
import type { BookingConfig, PaymentProvider } from '@/lib/appointments/types';
import type { SessionContext } from '@/lib/appointments/data';
import styles from '../booking.module.css';

type Props = {
  session: SessionContext;
  config: BookingConfig | null;
};

export default function BookingForm({ session, config }: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(appointmentServices[0].id);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

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
          setStatus(error.message);
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

  if (!session.configured || !config) {
    return (
      <div className={styles.card}>
        <p className={`${styles.message} ${styles.error}`}>
          الحجوزات الإلكترونية غير مفعّلة بعد. اتصل بالعيادة أو استخدم واتساب
          للحجز.
        </p>
        <div className={styles.actions}>
          <a href="tel:+201285827427" className={styles.primary} dir="ltr">
            +20 12 85827427
          </a>
          <a
            href="https://wa.me/201285827427"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ghost}
          >
            واتساب
          </a>
        </div>
      </div>
    );
  }

  if (!session.userId) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>سجّل الدخول أولًا</h2>
        <p className={styles.cardNote}>
          يمكنك المتابعة بحساب Google أو Microsoft. لا تُطلب أي بيانات طبية.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => void signIn('google')}
          >
            Google
          </button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => void signIn('azure')}
          >
            Microsoft
          </button>
        </div>
      </div>
    );
  }

  async function signIn(target: 'google' | 'azure') {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: target,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/appointments`,
      },
    });
    if (error) {
      setStatus(error.message);
      setBusy(false);
    }
  }

  async function submit() {
    const supabase = getBrowserClient();
    if (!supabase) return;

    if (!time) {
      setStatus('اختر وقتًا من الأوقات المتاحة.');
      return;
    }
    if (needsPayment && !provider) {
      setStatus('اختر وسيلة الدفع.');
      return;
    }

    setBusy(true);
    setStatus('');
    const { data, error } = await supabase.functions.invoke('create-booking', {
      body: { serviceId, date, time, note, provider },
    });

    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }

    if (data?.redirectUrl) {
      window.location.assign(data.redirectUrl);
      return;
    }

    router.push('/my-appointments');
    router.refresh();
  }

  const selectedService =
    appointmentServices.find((service) => service.id === serviceId) ??
    appointmentServices[0];

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>تفاصيل الموعد</h2>
        <p className={styles.cardNote}>
          الأوقات المعروضة من إعدادات العيادة. لا يمكن حجز أكثر من مريض في نفس
          الوقت.
        </p>

        {status ? <p className={styles.message}>{status}</p> : null}

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
            disabled={busy || !time || (needsPayment && !provider)}
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
                  لم يُفعّل أي مزود دفع. غيّر الإعدادات أو تواصل مع العيادة.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
