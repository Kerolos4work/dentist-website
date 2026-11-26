'use client';

import type { AvailableSession } from '@/lib/appointments/types';
import styles from '../booking.module.css';

type Props = {
  sessions: AvailableSession[];
  value: string;
  onChange: (start: string) => void;
};

function shortTime(value: string): string {
  return value.slice(0, 5);
}

function sessionRange(session: AvailableSession): string {
  return `${shortTime(session.session_start)} – ${shortTime(session.session_end)}`;
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
              {sessionRange(session)}
            </span>
            {low ? <span className={styles.lowBadge}>{low}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
