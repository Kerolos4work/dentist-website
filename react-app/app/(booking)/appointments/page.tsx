import type { Metadata } from 'next';
import { getBookingConfig } from '@/lib/appointments/data';
import BookingForm from './BookingForm';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'حجز موعد',
  description: 'احجز كشفًا مع د. عادل يسري وتابع حالة موعدك عبر الموقع.',
};

export default async function AppointmentsPage() {
  const config = await getBookingConfig();

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>APPOINTMENT / REQUEST</p>
        <h1 className={styles.title}>احجز موعدك</h1>
        <p className={styles.lead}>
          اكتب اسمك ورقم هاتفك، واختر اليوم وجلسة الطبيب المناسبة من التقويم. لا تختار وقتًا محددًا؛ سيمنحك النظام رقم دور ووقت انتظار متوقع ووقت وصول الطبيب. الكشف 300 جنيه.
        </p>
      </header>

      <BookingForm config={config} />
    </div>
  );
}
