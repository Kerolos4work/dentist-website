import type { Metadata } from 'next';
import {
  getPatientAppointments,
  getSessionContext,
} from '@/lib/appointments/data';
import { paymentLabels, statusLabels } from '@/lib/appointments/labels';
import SignIn from '../SignIn';
import AppointmentActions from './AppointmentActions';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'مواعيدي',
  description: 'تابع حالة حجوزاتك مع عيادة د. عادل يسري.',
};

export default async function MyAppointmentsPage() {
  const session = await getSessionContext();

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>APPOINTMENT / STATUS</p>
        <h1 className={styles.title}>مواعيدي</h1>
        <p className={styles.lead}>
          هنا تظهر حالة الحجز بعد الدفع أو التأكيد. يمكنك إلغاء الموعد قبل
          الوصول إلى العيادة.
        </p>
      </header>

      {!session.configured ? (
        <div className={styles.card}>
          <p className={styles.message}>
            الحجوزات الإلكترونية غير مفعّلة بعد. استخدم الهاتف أو واتساب.
          </p>
        </div>
      ) : !session.userId ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>سجّل الدخول لعرض مواعيدك</h2>
          <p className={styles.cardNote}>Google أو Microsoft.</p>
          <SignIn next="/my-appointments" />
        </div>
      ) : (
        <AppointmentsList patientId={session.userId} />
      )}
    </div>
  );
}

async function AppointmentsList({ patientId }: { patientId: string }) {
  const appointments = await getPatientAppointments(patientId);

  if (!appointments.length) {
    return (
      <div className={styles.empty}>لا توجد حجوزات بعد.</div>
    );
  }

  return (
    <div className={styles.list}>
      {appointments.map((appointment) => (
        <article key={appointment.id} className={styles.item}>
          <div className={styles.itemHead}>
            <h2 className={styles.itemTitle}>{appointment.service_label}</h2>
            <span
              className={`${styles.badge} ${
                appointment.status === 'awaiting_payment' ||
                appointment.status === 'needs_review'
                  ? styles.badgePending
                  : styles.badgeDone
              }`}
            >
              {statusLabels[appointment.status]}
            </span>
          </div>

          <div className={styles.itemMeta}>
            <div>
              <span>اليوم</span>
              <b dir="ltr">{appointment.appointment_date}</b>
            </div>
            <div>
              <span>الوقت</span>
              <b dir="ltr">{appointment.start_time}</b>
            </div>
            <div>
              <span>الدفع</span>
              <b>{paymentLabels[appointment.payment_status]}</b>
            </div>
            <div>
              <span>الكشف</span>
              <b dir="ltr">
                {appointment.fee_amount} {appointment.currency}
              </b>
            </div>
          </div>

          {appointment.patient_note ? (
            <p className={styles.cardNote}>ملاحظتك: {appointment.patient_note}</p>
          ) : null}

          {['awaiting_payment', 'needs_review', 'confirmed'].includes(
            appointment.status
          ) ? (
            <AppointmentActions id={appointment.id} />
          ) : null}
        </article>
      ))}
    </div>
  );
}
