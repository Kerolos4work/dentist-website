import { getServerClient } from '@/lib/supabase/server';
import type {
  Appointment,
  AvailableSession,
  BookingConfig,
  ClosedDate,
  DoctorSession,
  DoctorSettings,
  Profile,
  Role,
} from './types';

export type SessionContext = {
  configured: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
};

export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await getServerClient();
  if (!supabase) {
    return { configured: false, userId: null, email: null, profile: null };
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { configured: true, userId: null, email: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, avatar_url')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    configured: true,
    userId: data.user.id,
    email: data.user.email ?? null,
    profile: (profile as Profile | null) ?? null,
  };
}

export async function getBookingConfig(): Promise<BookingConfig | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('booking_config')
    .select(
      'approval_mode, paymob_enabled, fawry_enabled, open_days, work_start, work_end, slot_minutes, timezone, hold_minutes'
    )
    .eq('id', 'clinic')
    .maybeSingle();

  return (data as BookingConfig | null) ?? null;
}

const appointmentColumns =
  'id, patient_id, patient_name, patient_phone, patient_email, booking_reference, service_id, service_label, fee_amount, currency, appointment_date, start_time, end_time, queue_number, expected_wait_minutes, doctor_arrival_time, status, payment_provider, payment_status, payment_reference, patient_note, nurse_note, reviewed_by, reviewed_at, checked_in_at, created_at';

export async function getPatientAppointments(
  patientId: string
): Promise<Appointment[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('appointments')
    .select(appointmentColumns)
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: false })
    .limit(50);

  return (data as Appointment[] | null) ?? [];
}

export async function getStaffAppointments(role: Role): Promise<Appointment[]> {
  const supabase = await getServerClient();
  if (!supabase || !['nurse', 'doctor', 'admin'].includes(role)) return [];

  let query = supabase
    .from('appointments')
    .select(appointmentColumns)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(200);

  if (role === 'doctor') {
    query = query.in('status', ['confirmed', 'arrived', 'completed']);
  }

  const { data } = await query;
  return (data as Appointment[] | null) ?? [];
}

export async function getPatientProfiles(): Promise<
  Record<string, { full_name: string | null; phone: string | null }>
> {
  const supabase = await getServerClient();
  if (!supabase) return {};

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone');

  const map: Record<string, { full_name: string | null; phone: string | null }> =
    {};
  (data ?? []).forEach((profile) => {
    map[profile.id] = {
      full_name: profile.full_name,
      phone: profile.phone,
    };
  });
  return map;
}

export async function getDoctorSettings(): Promise<DoctorSettings | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('doctor_settings')
    .select('*')
    .eq('id', 'clinic')
    .maybeSingle();

  return (data as DoctorSettings | null) ?? null;
}

export async function getDoctorSessions(): Promise<DoctorSession[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('doctor_sessions')
    .select('id, scope, scope_key, start_time, end_time, patient_limit')
    .order('scope')
    .order('start_time');

  return (data as DoctorSession[] | null) ?? [];
}

export async function getClosedDates(): Promise<string[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('doctor_closed_dates')
    .select('appointment_date')
    .order('appointment_date');

  return ((data as ClosedDate[] | null) ?? []).map(
    (row) => row.appointment_date
  );
}

export async function getAvailableSessions(
  date: string
): Promise<AvailableSession[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const { data } = await supabase.rpc('booking_available_sessions', {
    p_date: date,
  });

  return (data as AvailableSession[] | null) ?? [];
}
