import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DevLoginForm from './DevLoginForm';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'دخول تجريبي',
  description: 'صفحة دخول مؤقتة لاختبار حسابات الموظفين محليًا.',
};

export default function TestLoginPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>DEV / TEST LOGIN</p>
        <h1 className={styles.title}>دخول تجريبي</h1>
        <p className={styles.lead}>
          صفحة محلية فقط لاختبار حسابات الموظفين. لا تظهر في نسخة الإنتاج.
        </p>
      </header>
      <div className={styles.card}>
        <DevLoginForm />
      </div>
    </div>
  );
}
