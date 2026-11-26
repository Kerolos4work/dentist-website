import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getPatientProfiles,
  getSessionContext,
  getStaffAppointments,
} from '@/lib/appointments/data';
import { paymentLabels, statusLabels } from '@/lib/appointments/labels';
import styles from '../../booking.module.css';

export const metadata: Metadata = {
  title: 'لوحة الطبيب',
  description: 'قائمة المرضى المؤكدين للحجوزات القادمة.',
};

export default async function DoctorDashboardPage() {
  const session = await getSessionContext();
  if (!['doctor', 'admin'].includes(session.profile?.role ?? '')) {
    redirect('/dashboard');
  }

  const [appointments, profiles] = await Promise.all([
    getStaffAppointments('doctor'),
    getPatientProfiles(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>DOCTOR / SCHEDULE</p>
        <h1 className={styles.title}>لوحة الطبيب</h1>
        <p className={styles.lead}>
          المرضى المؤكدون فقط. عرض للقراءة؛ إدارة الحضور تتم من لوحة الممرضة.
        </p>
        <nav className={styles.tabs} aria-label="تبويبات الطبيب">
          <Link href="/dashboard/nurse" className={styles.tab}>
            لوحة الممرضة
          </Link>
          <Link href="/dashboard/settings" className={styles.tab}>
            إعدادات الحجز
          </Link>
        </nav>
      </header>

      <div className={styles.list}>
        {appointments.length ? (
          appointments.map((appointment) => {
            const profile = appointment.patient_id
              ? profiles[appointment.patient_id]
              : undefined;
            const patientName = appointment.patient_name ?? profile?.full_name ?? '—';
            const patientPhone = appointment.patient_phone ?? profile?.phone ?? '—';

            return (
              <article key={appointment.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h2 className={styles.itemTitle}>
                    {appointment.service_label}
                  </h2>
                  <span className={styles.badge}>
                    {statusLabels[appointment.status]}
                  </span>
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
                    <span>الوقت المتوقع للكشف</span>
                    <b dir="ltr">{appointment.start_time.slice(0, 5)}</b>
                  </div>
                  <div>
                    <span>رقم الدور</span>
                    <b dir="ltr">{appointment.queue_number ?? '—'}</b>
                  </div>
                  <div>
                    <span>الانتظار المتوقع</span>
                    <b>
                      {appointment.expected_wait_minutes === null
                        ? '—'
                        : `${appointment.expected_wait_minutes} دقيقة`}
                    </b>
                  </div>
                  <div>
                    <span>وصول الطبيب</span>
                    <b dir="ltr">
                      {appointment.doctor_arrival_time?.slice(0, 5) ?? '—'}
                    </b>
                  </div>
                  <div>
                    <span>الدفع</span>
                    <b>{paymentLabels[appointment.payment_status]}</b>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className={styles.empty}>لا توجد مواعيد مؤكدة بعد.</div>
        )}
      </div>
    </div>
  );
}
