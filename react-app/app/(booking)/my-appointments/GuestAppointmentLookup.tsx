'use client';

import { useState } from 'react';
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

export default function GuestAppointmentLookup() {
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [appointment, setAppointment] = useState<GuestAppointment | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function lookup() {
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    setAppointment(null);

    const { data, error } = await supabase.rpc('guest_lookup_appointment', {
      p_reference: reference.trim(),
      p_phone: phone.trim(),
    });

    if (error) {
      setStatus(readableError(error));
      setBusy(false);
      return;
    }

    const rows = (data ?? []) as GuestAppointment[];
    if (!rows.length) {
      setStatus('لم نعثر على حجز بهذا الرقم ورقم الهاتف.');
    } else {
      setAppointment(rows[0]);
    }
    setBusy(false);
  }

  async function cancel() {
    if (!appointment) return;
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    const { error } = await supabase.rpc('guest_cancel_appointment', {
      p_reference: appointment.booking_reference,
      p_phone: phone.trim(),
    });

    if (error) {
      setStatus(readableError(error));
    } else {
      setAppointment({ ...appointment, status: 'cancelled' });
      setStatus('تم إلغاء الموعد.');
    }
    setBusy(false);
  }

  const canCancel = appointment
    ? ['awaiting_payment', 'needs_review', 'confirmed'].includes(
        appointment.status
      )
    : false;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>ابحث عن حجزك</h2>
        <p className={styles.cardNote}>
          أدخل رقم الحجز الذي ظهر لك بعد التأكيد، ورقم الهاتف المستخدم في الحجز.
        </p>

        {status ? <p className={`${styles.message} ${styles.error}`}>{status}</p> : null}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="reference">
            رقم الحجز
          </label>
          <input
            id="reference"
            type="text"
            dir="ltr"
            required
            className={styles.input}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="AY-123456"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="lookup-phone">
            رقم الهاتف
          </label>
          <input
            id="lookup-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            required
            className={styles.input}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+20 12 85827427"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={busy || !reference.trim() || !phone.trim()}
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
        <h2 className={styles.cardTitle}>تفاصيل الموعد</h2>
        {!appointment ? (
          <p className={styles.cardNote}>
            لن تظهر التفاصيل إلا بعد إدخال رقم الحجز ورقم الهاتف بشكل صحيح.
          </p>
        ) : (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>رقم الحجز</span>
                <b dir="ltr">{appointment.booking_reference}</b>
              </div>
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
                <span>الحالة</span>
                <b>{statusLabels[appointment.status]}</b>
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

            {canCancel ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.ghost}
                  disabled={busy}
                  onClick={() => void cancel()}
                >
                  {busy ? 'جارٍ الإلغاء…' : 'إلغاء الموعد'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}
