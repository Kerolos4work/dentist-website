import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getPatientProfiles,
  getSessionContext,
  getStaffAppointments,
} from '@/lib/appointments/data';
import { paymentLabels, statusLabels } from '@/lib/appointments/labels';
import NurseActions from './NurseActions';
import styles from '../../booking.module.css';

export const metadata: Metadata = {
  title: 'لوحة الممرضة',
  description: 'مراجعة الحجوزات وتأكيد الحضور.',
};

export default async function NurseDashboardPage() {
  const session = await getSessionContext();
  if (!session.userId || !['nurse', 'admin'].includes(session.profile?.role ?? '')) {
    redirect('/dashboard');
  }

  const [appointments, profiles] = await Promise.all([
    getStaffAppointments('nurse'),
    getPatientProfiles(),
  ]);

  const review = appointments.filter((item) =>
    ['awaiting_payment', 'needs_review'].includes(item.status)
  );
  const upcoming = appointments.filter((item) =>
    ['confirmed', 'arrived'].includes(item.status)
  );

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>NURSE / CONTROL</p>
        <h1 className={styles.title}>لوحة الممرضة</h1>
        <p className={styles.lead}>
          راجع الطلبات التي تحتاج تدخلًا، وسجّل وصول المرضى المؤكدين.
        </p>
        <nav className={styles.tabs} aria-label="تبويبات الممرضة">
          <Link href="/dashboard/doctor" className={styles.tab}>
            لوحة الطبيب
          </Link>
          <Link href="/dashboard/settings" className={styles.tab}>
            إعدادات الحجز
          </Link>
        </nav>
      </header>

      <h2 className={styles.cardTitle}>طلبات تحتاج مراجعة</h2>
      <div className={styles.list}>
        {review.length ? (
          review.map((appointment) => (
            <article key={appointment.id} className={styles.item}>
              <AppointmentInfo appointment={appointment} profiles={profiles} />
              <NurseActions id={appointment.id} mode="review" />
            </article>
          ))
        ) : (
          <div className={styles.empty}>لا توجد طلبات تحتاج مراجعة.</div>
        )}
      </div>

      <h2 className={styles.cardTitle}>الحاضرون والمؤكدون</h2>
      <div className={styles.list}>
        {upcoming.length ? (
          upcoming.map((appointment) => (
            <article key={appointment.id} className={styles.item}>
              <AppointmentInfo appointment={appointment} profiles={profiles} />
              <NurseActions id={appointment.id} mode="arrival" />
            </article>
          ))
        ) : (
          <div className={styles.empty}>لا توجد مواعيد قادمة.</div>
        )}
      </div>
    </div>
  );
}

function AppointmentInfo({
  appointment,
  profiles,
}: {
  appointment: Awaited<ReturnType<typeof getStaffAppointments>>[number];
  profiles: Record<string, { full_name: string | null; phone: string | null }>;
}) {
  const profile = appointment.patient_id
    ? profiles[appointment.patient_id]
    : undefined;
  const patientName = appointment.patient_name ?? profile?.full_name ?? '—';
  const patientPhone = appointment.patient_phone ?? profile?.phone ?? '—';

  return (
    <>
      <div className={styles.itemHead}>
        <h3 className={styles.itemTitle}>{appointment.service_label}</h3>
        <span className={styles.badge}>{statusLabels[appointment.status]}</span>
      </div>
      <div className={styles.itemMeta}>
        <div>
          <span>المريض</span>
          <b>{patientName}</b>
        </div>
        <div>
          <span>الهاتف</span>
          <b dir="ltr">{patientPhone}</b>
        </div>
        <div>
          <span>رقم الحجز</span>
          <b dir="ltr">{appointment.booking_reference}</b>
        </div>
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
      </div>
      {appointment.patient_note ? (
        <p className={styles.cardNote}>ملاحظة: {appointment.patient_note}</p>
      ) : null}
    </>
  );
}
