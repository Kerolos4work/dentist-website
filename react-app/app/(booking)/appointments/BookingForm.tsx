'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';
import { generalCheckupService, appointmentServices } from '@/lib/appointments/services';
import { isOpenDay, todayIso } from '@/lib/appointments/slots';
import type {
  AvailableSession,
  BookingConfig,
  PaymentProvider,
} from '@/lib/appointments/types';
import styles from '../booking.module.css';
import SessionPicker from './SessionPicker';

type Props = {
  config: BookingConfig | null;
};

type Confirmation = {
  reference: string;
  service: string;
  date: string;
  sessionStart: string;
  sessionEnd: string;
  status: string;
  paymentStatus: string;
  queueNumber: number;
  expectedWaitMinutes: number;
  doctorArrivalTime: string;
};

type BookingResponse = {
  bookingReference?: string;
  status?: string;
  paymentStatus?: string;
  redirectUrl?: string;
  queueNumber?: number;
  expectedWaitMinutes?: number;
  doctorArrivalTime?: string;
  error?: string;
};

const weekdayLabels = [
  'أحد',
  'اثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
];

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function shortTime(value: string): string {
  return value.slice(0, 5);
}

function sessionRange(session: AvailableSession): string {
  return `${shortTime(session.session_start)} – ${shortTime(session.session_end)}`;
}

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
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [sessionStart, setSessionStart] = useState('');
  const [note, setNote] = useState('');
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [status, setStatus] = useState('');
  const [errorField, setErrorField] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date(`${todayIso()}T12:00:00`);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const showError = useCallback((message: string, field = 'booking-error') => {
    setStatus(message);
    setErrorField(field);
    setTimeout(() => {
      const target = document.getElementById(field);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
    });
  }, []);

  // Sessions come from the database so the same quotas, closures and doctor
  // schedule shown here are the ones enforced when the booking is inserted.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase || !date) {
      setSessions([]);
      setSessionStart('');
      setSessionsLoading(false);
      return;
    }

    let active = true;
    setSessions([]);
    setSessionStart('');
    setSessionsLoading(true);
    void supabase
      .rpc('booking_available_sessions', { p_date: date })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSessions([]);
          showError('تعذّر تحميل جلسات الطبيب. حاول لاحقًا.');
        } else {
          setSessions((data ?? []) as AvailableSession[]);
        }
        setSessionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [date, showError]);

  const needsPayment = config?.approval_mode === 'auto_after_payment';
  const availableProviders = [
    config?.paymob_enabled ? 'paymob' : null,
    config?.fawry_enabled ? 'fawry' : null,
  ].filter(Boolean) as PaymentProvider[];

  const selectedService = serviceId
    ? appointmentServices.find((service) => service.id === serviceId) ??
      generalCheckupService
    : generalCheckupService;
  const selectedSession = sessions.find(
    (session) => session.session_start === sessionStart
  );
  const visibleSessions = sessions.slice(0, 5);
  const today = todayIso();

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

  const firstOfMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  );
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + index);
    return cell;
  });
  const thisMonth = new Date(`${today}T12:00:00`);
  const canGoBack =
    visibleMonth.getFullYear() > thisMonth.getFullYear() ||
    (visibleMonth.getFullYear() === thisMonth.getFullYear() &&
      visibleMonth.getMonth() > thisMonth.getMonth());

  async function submit() {
    if (confirmation) return;

    if (fullName.trim().length < 2) {
      showError('اكتب اسمك كاملًا.', 'fullName');
      return;
    }
    if (!phone.trim()) {
      showError('اكتب رقم الهاتف.', 'phone');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('البريد الإلكتروني غير صالح.', 'email');
      return;
    }
    if (!selectedSession) {
      showError('اختر جلسة الطبيب من القائمة.', 'session-field');
      return;
    }
    if (needsPayment && !provider) {
      showError('اختر وسيلة الدفع.', 'provider-field');
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    setErrorField('');
    const { data, error } = await supabase.functions.invoke('create-booking', {
      body: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        serviceId: serviceId || generalCheckupService.id,
        date,
        time: selectedSession.session_start,
        note,
        provider,
      },
    });

    if (error) {
      showError(await functionErrorMessage(error));
      setBusy(false);
      return;
    }

    const booked = data as BookingResponse;
    if (booked.error) {
      showError(booked.error);
      setBusy(false);
      return;
    }

    setConfirmation({
      reference: booked.bookingReference ?? '',
      service: selectedService.label,
      date,
      sessionStart: shortTime(selectedSession.session_start),
      sessionEnd: shortTime(selectedSession.session_end),
      status: booked.status === 'awaiting_payment' ? 'بانتظار الدفع' : 'مؤكد',
      paymentStatus:
        booked.paymentStatus === 'due_at_clinic' ? 'يدفع في العيادة' : 'جارٍ الدفع',
      queueNumber: booked.queueNumber ?? 1,
      expectedWaitMinutes: booked.expectedWaitMinutes ?? 0,
      doctorArrivalTime: shortTime(
        booked.doctorArrivalTime ?? selectedSession.doctor_arrival_time
      ),
    });

    if (booked.redirectUrl) {
      window.location.assign(booked.redirectUrl);
      return;
    }
    setBusy(false);
  }

  if (confirmation) {
    return (
      <div className={styles.confirmationCard}>
        <div className={styles.confirmationHead}>
          <span className={styles.confirmationKicker}>تم تسجيل طلبك</span>
          <h2 className={styles.cardTitle}>رقم دورك</h2>
        </div>

        <div className={styles.queueHero}>
          <b dir="ltr">{confirmation.queueNumber}</b>
          <span>
            الانتظار المتوقع {confirmation.expectedWaitMinutes} دقيقة
          </span>
        </div>

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
            <span>جلسة الطبيب</span>
            <b dir="ltr">
              {confirmation.sessionStart} – {confirmation.sessionEnd}
            </b>
          </div>
          <div className={styles.summaryRow}>
            <span>وصول الطبيب</span>
            <b dir="ltr">{confirmation.doctorArrivalTime}</b>
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

        {status ? (
          <p
            id="booking-error"
            tabIndex={-1}
            className={`${styles.message} ${styles.error} ${
              errorField ? styles.messageGlow : ''
            }`}
          >
            {status}
          </p>
        ) : null}

        <div
          className={`${styles.field} ${
            errorField === 'fullName' ? styles.fieldGlow : ''
          }`}
        >
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
            onChange={(event) => {
              setFullName(event.target.value);
              setErrorField('');
            }}
            placeholder="الاسم كما يظهر في جواز السفر أو الهوية"
          />
        </div>

        <div
          className={`${styles.field} ${
            errorField === 'phone' ? styles.fieldGlow : ''
          }`}
        >
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
            onChange={(event) => {
              setPhone(event.target.value);
              setErrorField('');
            }}
            placeholder="+20 12 85827427"
          />
        </div>

        <div
          className={`${styles.field} ${
            errorField === 'email' ? styles.fieldGlow : ''
          }`}
        >
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
            onChange={(event) => {
              setEmail(event.target.value);
              setErrorField('');
            }}
            placeholder="name@example.com"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="service">
            التخصص (اختياري)
          </label>
          <select
            id="service"
            className={styles.select}
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            <option value="">{generalCheckupService.label} — بدون تحديد</option>
            {appointmentServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        <h2 className={styles.cardTitle}>موعدك</h2>
        <p className={styles.cardNote}>
          اختر يومًا من التقويم، ثم اختر جلسة الطبيب. لا تختار وقتًا محددًا؛
          سيمنحك النظام رقم دور ووقت انتظار متوقع.
        </p>

        <div className={styles.field}>
          <span className={styles.label}>اليوم</span>
          <div className={styles.calendar}>
            <div className={styles.calendarHead}>
              <button
                type="button"
                className={styles.calendarNav}
                disabled={!canGoBack}
                aria-label="الشهر السابق"
                onClick={() =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      visibleMonth.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                ‹
              </button>
              <strong>{monthLabel(visibleMonth)}</strong>
              <button
                type="button"
                className={styles.calendarNav}
                aria-label="الشهر التالي"
                onClick={() =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      visibleMonth.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                ›
              </button>
            </div>

            <div className={styles.calendarGrid}>
              {weekdayLabels.map((label) => (
                <span key={label} className={styles.calendarWeekday}>
                  {label}
                </span>
              ))}
              {calendarDays.map((cell) => {
                const cellIso = isoDate(cell);
                const outsideMonth =
                  cell.getMonth() !== visibleMonth.getMonth() ||
                  cell.getFullYear() !== visibleMonth.getFullYear();
                const isNextMonth =
                  cell.getFullYear() > visibleMonth.getFullYear() ||
                  (cell.getFullYear() === visibleMonth.getFullYear() &&
                    cell.getMonth() > visibleMonth.getMonth());
                const isPrevMonth =
                  cell.getFullYear() < visibleMonth.getFullYear() ||
                  (cell.getFullYear() === visibleMonth.getFullYear() &&
                    cell.getMonth() < visibleMonth.getMonth());
                const adjacentMonth = isNextMonth || isPrevMonth;
                const disabled =
                  (outsideMonth && !adjacentMonth) ||
                  cellIso < today ||
                  !isOpenDay(config, cellIso);
                const selected = cellIso === date;

                return (
                  <button
                    key={cellIso}
                    type="button"
                    className={`${styles.calendarDay} ${
                      selected ? styles.calendarDayActive : ''
                    } ${adjacentMonth ? styles.calendarDayAdjacent : ''}`}
                    disabled={disabled}
                    aria-label={cellIso}
                    aria-pressed={selected}
                    onClick={() => {
                      if (adjacentMonth) {
                        setVisibleMonth(
                          new Date(cell.getFullYear(), cell.getMonth(), 1)
                        );
                      }
                      setDate(cellIso);
                    }}
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>
            <p className={styles.calendarHint}>
              اليوم المختار: <b dir="ltr">{date}</b>
            </p>
          </div>
        </div>

        <div
          id="session-field"
          tabIndex={-1}
          className={`${styles.field} ${
            errorField === 'session-field' ? styles.fieldGlow : ''
          }`}
        >
          <span className={styles.label}>جلسة الطبيب</span>
          {visibleSessions.length ? (
            <SessionPicker
              sessions={visibleSessions}
              value={sessionStart}
              onChange={(start) => {
                setSessionStart(start);
                setErrorField('');
              }}
            />
          ) : (
            <p className={styles.message}>
              {sessionsLoading
                ? 'جارٍ تحميل جلسات الطبيب…'
                : 'لا توجد جلسات متاحة لهذا اليوم.'}
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
              !selectedSession ||
              (needsPayment && !provider)
            }
            onClick={() => void submit()}
          >
            {busy ? 'جارٍ الإرسال…' : needsPayment ? 'ادفع وأكّد' : 'تأكيد الحجز'}
          </button>
        </div>
      </div>

      <aside className={`${styles.card} ${styles.summaryCard}`}>
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
            <span>اليوم</span>
            <b dir="ltr">{date}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>جلسة الطبيب</span>
            <b dir="ltr">
              {selectedSession ? sessionRange(selectedSession) : '—'}
            </b>
          </div>
          <div className={styles.summaryRow}>
            <span>وصول الطبيب</span>
            <b dir="ltr">
              {selectedSession
                ? shortTime(selectedSession.doctor_arrival_time)
                : '—'}
            </b>
          </div>
          <div className={styles.summaryRow}>
            <span>رقم الدور</span>
            <b>يُحدد بعد الحجز</b>
          </div>
          <div className={styles.summaryRow}>
            <span>النوع</span>
            <b>
              {needsPayment ? 'دفع إلكتروني ثم تأكيد' : 'دفع في العيادة'}
            </b>
          </div>

          {needsPayment ? (
            <div
              id="provider-field"
              tabIndex={-1}
              className={`${styles.field} ${
                errorField === 'provider-field' ? styles.fieldGlow : ''
              }`}
            >
              <span className={styles.label}>وسيلة الدفع</span>
              <div className={styles.providerRow}>
                <button
                  type="button"
                  className={`${styles.provider} ${
                    provider === 'paymob' ? styles.providerActive : ''
                  }`}
                  disabled={!config.paymob_enabled}
                  onClick={() => {
                    setProvider('paymob');
                    setErrorField('');
                  }}
                >
                  Paymob
                </button>
                <button
                  type="button"
                  className={`${styles.provider} ${
                    provider === 'fawry' ? styles.providerActive : ''
                  }`}
                  disabled={!config.fawry_enabled}
                  onClick={() => {
                    setProvider('fawry');
                    setErrorField('');
                  }}
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
