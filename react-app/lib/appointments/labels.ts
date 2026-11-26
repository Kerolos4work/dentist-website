import type { AppointmentStatus, PaymentStatus } from './types';

export const statusLabels: Record<AppointmentStatus, string> = {
  awaiting_payment: 'بانتظار الدفع',
  needs_review: 'تحت المراجعة',
  confirmed: 'مؤكد',
  declined: 'مرفوض',
  arrived: 'وصل',
  completed: 'منتهي',
  cancelled: 'ملغي',
};

export const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  awaiting_payment: 'جارٍ الدفع',
  paid: 'مدفوع',
  due_at_clinic: 'يدفع في العيادة',
  failed: 'فشل الدفع',
  refunded: 'مسترد',
};
