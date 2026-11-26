'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import { paymentLabels, statusLabels } from '@/lib/appointments/labels';
import type { GuestAppointment } from '@/lib/appointments/types';
import GoogleSignInButton from '../GoogleSignInButton';
import styles from '../booking.module.css';

type PatientUser = {
  id: string;
  email: string | null;
  fullName: string | null;
};

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

function AppointmentDetails({ appointment }: { appointment: GuestAppointment }) {
  return (
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
  );
}

export default function PatientAccount() {
  const router = useRouter();
  const [user, setUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<GuestAppointment[]>([]);
  const [claimReference, setClaimReference] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [status, setStatus] = useState('');
  const [errorField, setErrorField] = useState('');
  const [busy, setBusy] = useState(false);

  const showError = useCallback((message: string, field = 'account-error') => {
    setStatus(message);
    setErrorField(field);
    setTimeout(() => {
      const target = document.getElementById(field);
      if (!target) return;
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
      target.focus({ preventScroll: true });
    });
  }, []);

  const loadAppointments = useCallback(
    async (patientId: string) => {
      const supabase = getBrowserClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(
          'id, booking_reference, service_label, appointment_date, start_time, end_time, queue_number, expected_wait_minutes, doctor_arrival_time, status, payment_status, payment_provider, fee_amount, currency, patient_name, patient_phone, patient_note, created_at'
        )
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        showError(readableError(error));
        return;
      }

      setAppointments((data ?? []) as GuestAppointment[]);
    },
    [showError]
  );

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const authUser = data.user;
      if (!authUser) {
        setLoading(false);
        return;
      }

      const nextUser: PatientUser = {
        id: authUser.id,
        email: authUser.email ?? null,
        fullName:
          typeof authUser.user_metadata?.full_name === 'string'
            ? authUser.user_metadata.full_name
            : null,
      };
      setUser(nextUser);
      void loadAppointments(nextUser.id).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
    };
  }, [loadAppointments]);

  async function claim() {
    if (!user) return;
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    setErrorField('');

    const { data, error } = await supabase.rpc('claim_guest_appointment', {
      p_reference: claimReference.trim(),
      p_phone: claimPhone.trim(),
    });

    if (error) {
      showError(readableError(error), 'claim-phone');
      setBusy(false);
      return;
    }

    const rows = (data ?? []) as GuestAppointment[];
    setAppointments((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [...rows.filter((item) => !seen.has(item.id)), ...current];
    });
    setClaimReference('');
    setClaimPhone('');
    setStatus('تم ربط الحجز بحسابك.');
    setBusy(false);
  }

  async function cancel(appointment: GuestAppointment) {
    if (!user) return;
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    setErrorField('');

    const { error } = await supabase.rpc('patient_cancel_appointment', {
      p_appointment_id: appointment.id,
    });

    if (error) {
      showError(readableError(error));
      setBusy(false);
      return;
    }

    await loadAppointments(user.id);
    setStatus('تم إلغاء الموعد.');
    setBusy(false);
  }

  async function signOut() {
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    await supabase.auth.signOut();
    setUser(null);
    setAppointments([]);
    setStatus('تم تسجيل الخروج.');
    setErrorField('');
    setBusy(false);
    router.refresh();
  }

  if (loading) {
    return (
      <div className={styles.card}>
        <p className={styles.message}>جارٍ تحميل حسابك…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>حساب المريض</h2>
        <p className={styles.cardNote}>
          الدخول اختياري. سجّل الدخول بـ Google لمشاهدة حجوزاتك المرتبطة بحسابك،
          أو تابع أي حجز برقمه ورقم الهاتف كما تفعل الآن.
        </p>
        <GoogleSignInButton
          audience="patient"
          next="/my-appointments"
          label="الدخول بـ Google"
          variant="ghost"
        />
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>حسابك</h2>
        <p className={styles.cardNote} dir="ltr">
          {user.email ?? user.fullName ?? '—'}
        </p>

        {status ? (
          <p
            id="account-error"
            tabIndex={-1}
            className={`${styles.message} ${
              errorField ? styles.error : ''
            } ${errorField ? styles.messageGlow : ''}`}
          >
            {status}
          </p>
        ) : null}

        <h3 className={styles.cardTitle}>ربط حجز سابق</h3>
        <p className={styles.cardNote}>
          أدخل رقم الحجز ورقم الهاتف اللذين استخدمتهما عند الحجز كضيف. لا نربط
          الحجز بالبريد الإلكتروني وحده.
        </p>

        <div
          className={`${styles.field} ${
            errorField === 'claim-reference' ? styles.fieldGlow : ''
          }`}
        >
          <label className={styles.label} htmlFor="claim-reference">
            رقم الحجز
          </label>
          <input
            id="claim-reference"
            type="text"
            dir="ltr"
            className={styles.input}
            value={claimReference}
            onChange={(event) => {
              setClaimReference(event.target.value);
              setErrorField('');
            }}
            placeholder="AY-123456"
          />
        </div>

        <div
          className={`${styles.field} ${
            errorField === 'claim-phone' ? styles.fieldGlow : ''
          }`}
        >
          <label className={styles.label} htmlFor="claim-phone">
            رقم الهاتف
          </label>
          <input
            id="claim-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            className={styles.input}
            value={claimPhone}
            onChange={(event) => {
              setClaimPhone(event.target.value);
              setErrorField('');
            }}
            placeholder="+20 12 85827427"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={busy || !claimReference.trim() || !claimPhone.trim()}
            onClick={() => void claim()}
          >
            {busy ? 'جارٍ الربط…' : 'اربط الحجز بحسابي'}
          </button>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => void signOut()}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      <aside className={`${styles.card} ${styles.summaryCard}`}>
        <h2 className={styles.cardTitle}>حجوزات حسابك</h2>
        {!appointments.length ? (
          <p className={styles.cardNote}>
            لا توجد حجوزات مرتبطة بهذا الحساب بعد. يمكنك ربط حجز سابق من النموذج
            أو <Link href="/appointments">حجز موعد جديد</Link>.
          </p>
        ) : (
          <>
            <p className={styles.lookupCount}>
              {appointments.length === 1
                ? 'لديك حجز واحد.'
                : `لديك ${appointments.length} حجوزات.`}
            </p>
            <div className={styles.lookupList}>
              {appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className={styles.lookupItem}
                >
                  <div className={styles.lookupItemHead}>
                    <b dir="ltr">{appointment.booking_reference}</b>
                    <span>{statusLabels[appointment.status]}</span>
                  </div>
                  <AppointmentDetails appointment={appointment} />
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
                        onClick={() => void cancel(appointment)}
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
