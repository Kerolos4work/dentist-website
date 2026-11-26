'use client';

import type { AvailableSession } from '@/lib/appointments/types';
import styles from '../booking.module.css';

type Props = {
  sessions: AvailableSession[];
  value: string;
  onChange: (start: string) => void;
};

function clockPart(value: string): { time: string; meridiem: string } {
  const [rawHour = '0', rawMinute = '00'] = value.split(':');
  const hour = Number(rawHour);
  return {
    time: `${String(hour % 12 || 12).padStart(2, '0')}:${rawMinute.slice(0, 2)}`,
    meridiem: hour >= 12 ? 'PM' : 'AM',
  };
}

function availability(session: AvailableSession): string {
  if (session.remaining <= 0) return 'اكتملت';
  if (session.remaining <= 2) return `متبقٍ ${session.remaining}`;
  return '';
}

export default function SessionPicker({ sessions, value, onChange }: Props) {
  return (
    <div className={`${styles.sessionGrid} ${styles.sessionGridBare}`}>
      {sessions.map((session) => {
        const start = clockPart(session.session_start);
        const end = clockPart(session.session_end);
        const active = session.session_start === value;
        const full = session.remaining <= 0;
        const low = availability(session);

        return (
          <button
            key={session.session_start}
            type="button"
            className={`${styles.sessionCard} ${styles.sessionCardBare} ${
              active ? styles.sessionCardActive : ''
            }`}
            disabled={full}
            aria-pressed={active}
            onClick={() => onChange(session.session_start)}
          >
            <span className={styles.bareTime} dir="ltr">
              <span className={styles.bareTimePart}>
                {start.time}
                <small className={styles.timeMeridiem}>{start.meridiem}</small>
              </span>
              <span className={styles.bareTimeArrow} aria-hidden="true">
                ↓
              </span>
              <span className={styles.bareTimePart}>
                {end.time}
                <small className={styles.timeMeridiem}>{end.meridiem}</small>
              </span>
            </span>

            {low ? <span className={styles.lowBadge}>{low}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
