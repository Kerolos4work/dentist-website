import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getClosedDates,
  getDoctorSessions,
  getDoctorSettings,
  getSessionContext,
} from '@/lib/appointments/data';
import { todayIso } from '@/lib/appointments/slots';
import ClinicSettingsForm from './ClinicSettingsForm';

export const metadata: Metadata = {
  title: 'إعدادات الحجز',
  description: 'إعدادات الطبيب لطريقة الحجز والدفع وأوقات العمل.',
};

export default async function SettingsPage() {
  const session = await getSessionContext();
  if (!['doctor', 'admin'].includes(session.profile?.role ?? '')) {
    redirect('/dashboard');
  }

  const [settings, sessions, closedDates] = await Promise.all([
    getDoctorSettings(),
    getDoctorSessions(),
    getClosedDates(),
  ]);

  return (
    <ClinicSettingsForm
      settings={settings}
      sessions={sessions}
      closedDates={closedDates}
      today={todayIso()}
    />
  );
}
