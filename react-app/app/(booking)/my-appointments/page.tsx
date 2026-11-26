import type { Metadata } from 'next';
import GuestAppointmentLookup from './GuestAppointmentLookup';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'مواعيدي',
  description: 'تابع حالة حجزك برقم الحجز ورقم الهاتف بدون تسجيل دخول.',
};

export default function MyAppointmentsPage() {
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

      <GuestAppointmentLookup />
    </div>
  );
}
