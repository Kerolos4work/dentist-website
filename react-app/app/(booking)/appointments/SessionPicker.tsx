'use client';

import { Fragment } from 'react';
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
      {sessions.map((session, index) => {
        const start = clockPart(session.session_start);
        const end = clockPart(session.session_end);
        const active = session.session_start === value;
        const full = session.remaining <= 0;
        const low = availability(session);

        return (
          <Fragment key={session.session_start}>
            <button
              type="button"
              className={`${styles.sessionCard} ${styles.sessionCardBare} ${
                active ? styles.sessionCardActive : ''
              }`}
              disabled={full}
              aria-pressed={active}
              onClick={() => onChange(session.session_start)}
            >
              <span className={styles.sessionNumber} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className={styles.bareTime} dir="ltr">
                {start.time}
                <small className={styles.timeMeridiem}>{start.meridiem}</small>
                <span className={styles.timeSeparator}> – </span>
                {end.time}
                <small className={styles.timeMeridiem}>{end.meridiem}</small>
              </span>

              {low ? <span className={styles.lowBadge}>{low}</span> : null}
            </button>

            {index < sessions.length - 1 ? (
              <span className={styles.sessionArrow} aria-hidden="true">
                ↓
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
