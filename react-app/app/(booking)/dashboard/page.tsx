import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionContext } from '@/lib/appointments/data';
import SignIn from '../SignIn';
import styles from '../booking.module.css';

export const metadata: Metadata = {
  title: 'لوحة التحكم',
  description: 'دخول الممرضة والطبيب لإدارة حجوزات العيادة.',
};

export default async function DashboardEntryPage() {
  const session = await getSessionContext();

  if (!session.configured) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.message}>لوحة التحكم غير مفعّلة بعد.</p>
        </div>
      </div>
    );
  }

  if (!session.userId) {
    return (
      <div className={styles.page}>
        <header className={styles.head}>
          <p className={styles.kicker}>STAFF / SIGN IN</p>
          <h1 className={styles.title}>لوحة التحكم</h1>
          <p className={styles.lead}>
            دخول الموظفين بحساب Google Workspace الخاص بالعيادة.
          </p>
        </header>
        <div className={styles.card}>
          <SignIn next="/dashboard" />
        </div>
      </div>
    );
  }

  if (session.profile?.role === 'nurse') redirect('/dashboard/nurse');
  if (['doctor', 'admin'].includes(session.profile?.role ?? '')) {
    redirect('/dashboard/doctor');
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>حساب مريض</h2>
        <p className={styles.cardNote}>
          هذا الحساب لا يملك صلاحيات الموظفين. تابع حجوزاتك من صفحة مواعيدي.
        </p>
        <div className={styles.actions}>
          <Link href="/my-appointments" className={styles.primary}>
            مواعيدي
          </Link>
        </div>
      </div>
    </div>
  );
}
