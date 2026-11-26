import type { Metadata } from 'next';
import { getSessionContext } from '@/lib/appointments/data';
import GuestAppointmentLookup from './GuestAppointmentLookup';
import PatientAccount from './PatientAccount';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'مواعيدي',
  description: 'تابع حالة حجزك برقم الحجز ورقم الهاتف بدون تسجيل دخول.',
};

export default async function MyAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSessionContext();
  const { error } = await searchParams;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>APPOINTMENT / STATUS</p>
        <h1 className={styles.title}>مواعيدي</h1>
        <p className={styles.lead}>
          تابع حجزك برقم الحجز ورقم الهاتف اللذين استخدمتهما عند الحجز. لا
          تحتاج إلى تسجيل دخول، ويمكنك إلغاء الموعد قبل انتهاء المهلة المسموحة.
        </p>
      </header>

      {error === 'blocked' ? (
        <p className={`${styles.message} ${styles.error}`}>
          لا يمكن استخدام هذا الحساب لتسجيل الدخول. يمكنك متابعة حجزك كضيف برقم الحجز ورقم الهاتف.
        </p>
      ) : null}
      {error === 'auth' ? (
        <p className={`${styles.message} ${styles.error}`}>
          تعذّر إتمام الدخول. حاول مرة أخرى.
        </p>
      ) : null}

      {session.userId ? <PatientAccount /> : <GuestAppointmentLookup />}
    </div>
  );
}
