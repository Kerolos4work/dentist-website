import type { BookingConfig } from './types';

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isOpenDay(config: BookingConfig, date: string) {
  if (!config.open_days.length) return false;
  const day = new Date(`${date}T12:00:00`).getDay();
  return config.open_days.includes(day);
}

export function slotsForDate(config: BookingConfig, date: string) {
  if (
    !config.work_start ||
    !config.work_end ||
    !config.slot_minutes ||
    !isOpenDay(config, date)
  ) {
    return [];
  }

  const start = minutesFromTime(config.work_start);
  const end = minutesFromTime(config.work_end);
  const slots: string[] = [];

  for (let current = start; current + config.slot_minutes <= end; current += config.slot_minutes) {
    slots.push(timeFromMinutes(current));
  }
  return slots;
}

export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}
