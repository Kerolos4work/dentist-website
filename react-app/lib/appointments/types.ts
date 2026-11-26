export type Role = 'patient' | 'nurse' | 'doctor' | 'admin';

export type ApprovalMode = 'auto_after_payment' | 'pay_at_clinic_auto_confirmed';

export type PaymentProvider = 'paymob' | 'fawry';

export type AppointmentStatus =
  | 'awaiting_payment'
  | 'needs_review'
  | 'confirmed'
  | 'declined'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'awaiting_payment'
  | 'paid'
  | 'due_at_clinic'
  | 'failed'
  | 'refunded';

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type BookingConfig = {
  approval_mode: ApprovalMode;
  paymob_enabled: boolean;
  fawry_enabled: boolean;
  open_days: number[];
  work_start: string | null;
  work_end: string | null;
  slot_minutes: number;
  timezone: string;
  hold_minutes: number;
};

export type DoctorSettings = {
  id: string;
  approval_mode: ApprovalMode;
  paymob_enabled: boolean;
  fawry_enabled: boolean;
  open_days: number[];
  work_start: string | null;
  work_end: string | null;
  slot_minutes: number;
  hold_minutes: number;
  cancel_hours_before: number;
  timezone: string;
};

export type SessionScope = 'default' | 'weekday' | 'date';

export type DoctorSession = {
  id: string;
  scope: SessionScope;
  scope_key: string | null;
  start_time: string;
  end_time: string;
  patient_limit: number;
};

export type ClosedDate = {
  appointment_date: string;
};

export type AvailableSlot = {
  slot: string;
  session_start: string;
  session_end: string;
  patient_limit: number;
  booked: number;
  remaining: number;
};

export type Appointment = {
  id: string;
  patient_id: string;
  service_id: string;
  service_label: string;
  fee_amount: number;
  currency: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  payment_provider: PaymentProvider | null;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  patient_note: string | null;
  nurse_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  checked_in_at: string | null;
  created_at: string;
};
