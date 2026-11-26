import type { Metadata } from 'next';
import {
  getBookingConfig,
  getSessionContext,
} from '@/lib/appointments/data';
import BookingForm from './BookingForm';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'حجز موعد',
  description: 'احجز كشفًا مع د. عادل يسري وتابع حالة موعدك عبر الموقع.',
};

export default async function AppointmentsPage() {
  const [session, config] = await Promise.all([
    getSessionContext(),
    getBookingConfig(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>APPOINTMENT / REQUEST</p>
        <h1 className={styles.title}>احجز موعدك</h1>
        <p className={styles.lead}>
          اختر التخصص والوقت المناسب، ثم تابع حالة الحجز من صفحة «مواعيدي».
          الكشف 300 جنيه، والمواعيد تُؤكَّد وفق إعدادات العيادة.
        </p>
      </header>

      <BookingForm session={session} config={config} />
    </div>
  );
}
