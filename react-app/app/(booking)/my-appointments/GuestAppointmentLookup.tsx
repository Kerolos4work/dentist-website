'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import { paymentLabels, statusLabels } from '@/lib/appointments/labels';
import type { GuestAppointment } from '@/lib/appointments/types';
import styles from '../booking.module.css';

function readableError(error: unknown): string {
  const message = (error as { message?: string } | null)?.message ?? '';
  if (message && /[\u0600-\u06FF]/.test(message)) return message;
  return 'تعذّر إتمام الطلب. حاول لاحقًا.';
}

function canCancel(appointment: GuestAppointment): boolean {
  return ['awaiting_payment', 'needs_review', 'confirmed'].includes(
    appointment.status
  );
}

export default function GuestAppointmentLookup() {
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState<GuestAppointment[]>([]);
  const [status, setStatus] = useState('');
  const [errorField, setErrorField] = useState('');
  const [busy, setBusy] = useState(false);

  const showError = useCallback((message: string, field = 'lookup-error') => {
    setStatus(message);
    setErrorField(field);
    setTimeout(() => {
      const target = document.getElementById(field);
      if (!target) return;
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
      target.focus({ preventScroll: true });
    });
  }, []);

  async function lookup() {
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    setErrorField('');
    setAppointments([]);

    const { data, error } = await supabase.rpc('guest_lookup_appointment', {
      p_reference: reference.trim(),
      p_phone: phone.trim(),
    });

    if (error) {
      showError(readableError(error), 'lookup-phone');
      setBusy(false);
      return;
    }

    const rows = (data ?? []) as GuestAppointment[];
    if (!rows.length) {
      showError(
        reference.trim()
          ? 'لم نعثر على حجز بهذا الرقم ورقم الهاتف.'
          : 'لم نعثر على حجوز بهذا الهاتف.',
        reference.trim() ? 'reference' : 'lookup-phone'
      );
    } else {
      setAppointments(rows);
    }
    setBusy(false);
  }

  async function cancel(targetReference: string) {
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    setErrorField('');
    const { error } = await supabase.rpc('guest_cancel_appointment', {
      p_reference: targetReference,
      p_phone: phone.trim(),
    });

    if (error) {
      showError(readableError(error));
    } else {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.booking_reference === targetReference
            ? { ...appointment, status: 'cancelled' }
            : appointment
        )
      );
      setStatus('تم إلغاء الموعد.');
      setErrorField('');
    }
    setBusy(false);
  }

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>ابحث عن حجزك</h2>
        <p className={styles.cardNote}>
          ابحث برقم الهاتف المستخدم في الحجز. رقم الحجز اختياري إذا أردت تحديد موعد بعينه.
        </p>

        {status ? (
          <p
            id="lookup-error"
            tabIndex={-1}
            className={`${styles.message} ${styles.error} ${
              errorField ? styles.messageGlow : ''
            }`}
          >
            {status}
          </p>
        ) : null}

        <div
          className={`${styles.field} ${styles.lookupPrimaryField} ${
            errorField === 'lookup-phone' ? styles.fieldGlow : ''
          }`}
        >
          <label className={styles.label} htmlFor="lookup-phone">
            رقم الهاتف
          </label>
          <input
            id="lookup-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            required
            className={`${styles.input} ${styles.lookupInput}`}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setErrorField('');
            }}
            placeholder="+20 12 85827427"
          />
        </div>

        <div
          className={`${styles.field} ${
            errorField === 'reference' ? styles.fieldGlow : ''
          }`}
        >
          <label className={styles.label} htmlFor="reference">
            رقم الحجز (اختياري)
          </label>
          <input
            id="reference"
            type="text"
            dir="ltr"
            className={styles.input}
            value={reference}
            onChange={(event) => {
              setReference(event.target.value);
              setErrorField('');
            }}
            placeholder="AY-123456"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={busy || !phone.trim()}
            onClick={() => void lookup()}
          >
            {busy ? 'جارٍ البحث…' : 'اعرض موعدي'}
          </button>
          <Link href="/appointments" className={styles.ghost}>
            حجز جديد
          </Link>
        </div>
      </div>

      <aside className={styles.card}>
        <h2 className={styles.cardTitle}>حجوزاتك</h2>
        {!appointments.length ? (
          <p className={styles.cardNote}>
            أدخل رقم الهاتف لعرض كل الحجوزات المرتبطة به.
          </p>
        ) : (
          <>
            <p className={styles.lookupCount}>
              {appointments.length === 1
                ? 'تم العثور على حجز واحد.'
                : `تم العثور على ${appointments.length} حجوزات.`}
            </p>

            <div className={styles.lookupList}>
              {appointments.map((appointment) => (
                <article key={appointment.booking_reference} className={styles.lookupItem}>
                  <div className={styles.lookupItemHead}>
                    <b dir="ltr">{appointment.booking_reference}</b>
                    <span>{statusLabels[appointment.status]}</span>
                  </div>

                  <div className={styles.summary}>
                    <div className={styles.summaryRow}>
                      <span>المريض</span>
                      <b>{appointment.patient_name ?? '—'}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>الهاتف</span>
                      <b dir="ltr">{appointment.patient_phone ?? '—'}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>التخصص</span>
                      <b>{appointment.service_label}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>اليوم</span>
                      <b dir="ltr">{appointment.appointment_date}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>الوقت المتوقع للكشف</span>
                      <b dir="ltr">{appointment.start_time.slice(0, 5)}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>رقم الدور</span>
                      <b dir="ltr">{appointment.queue_number ?? '—'}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>الانتظار المتوقع</span>
                      <b>
                        {appointment.expected_wait_minutes === null
                          ? '—'
                          : `${appointment.expected_wait_minutes} دقيقة`}
                      </b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>وصول الطبيب</span>
                      <b dir="ltr">
                        {appointment.doctor_arrival_time?.slice(0, 5) ?? '—'}
                      </b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>الدفع</span>
                      <b>{paymentLabels[appointment.payment_status]}</b>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>الكشف</span>
                      <b dir="ltr">
                        {appointment.fee_amount} {appointment.currency}
                      </b>
                    </div>
                  </div>

                  {appointment.patient_note ? (
                    <p className={styles.cardNote}>
                      ملاحظتك: {appointment.patient_note}
                    </p>
                  ) : null}

                  {canCancel(appointment) ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.ghost}
                        disabled={busy}
                        onClick={() => void cancel(appointment.booking_reference)}
                      >
                        {busy ? 'جارٍ الإلغاء…' : 'إلغاء الموعد'}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
