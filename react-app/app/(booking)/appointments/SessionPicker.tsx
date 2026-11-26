'use client';

import { useState } from 'react';
import type { AvailableSession } from '@/lib/appointments/types';
import styles from '../booking.module.css';

type Design = 1 | 2 | 3 | 4 | 5;

type Props = {
  sessions: AvailableSession[];
  value: string;
  onChange: (start: string) => void;
};

const designs: Design[] = [1, 2, 3, 4, 5];

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
  const [design, setDesign] = useState<Design>(1);

  const gridClass = [
    styles.sessionGrid,
    design === 1 ? styles.sessionGridBare : '',
    design === 2 ? styles.sessionGridRule : '',
    design === 3 ? styles.sessionGridStack : '',
    design === 4 ? styles.sessionGridInline : '',
    design === 5 ? styles.sessionGridBars : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {process.env.NODE_ENV !== 'production' ? (
        <div className={styles.designSwitcher} role="group" aria-label="نمط عرض الجلسات">
          <span className={styles.designSwitcherLabel}>معاينة التصميم</span>
          {designs.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.designButton} ${
                design === option ? styles.designButtonActive : ''
              }`}
              aria-label={`نمط ${option}`}
              aria-pressed={design === option}
              onClick={() => setDesign(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      <div className={gridClass}>
        {sessions.map((session, index) => {
          const active = session.session_start === value;
          const full = session.remaining <= 0;
          const low = availability(session);
          const cardClass = [
            styles.sessionCard,
            design === 1 ? styles.sessionCardBare : '',
            design === 2 ? styles.sessionCardRule : '',
            design === 3 ? styles.sessionCardStack : '',
            design === 4 ? styles.sessionCardInline : '',
            design === 5 ? styles.sessionCardBars : '',
            active ? styles.sessionCardActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={session.session_start}
              type="button"
              className={cardClass}
              disabled={full}
              aria-pressed={active}
              onClick={() => onChange(session.session_start)}
            >
              {design === 1 ? (
                <>
                  <span className={styles.bareTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  {low ? <span className={styles.lowBadge}>{low}</span> : null}
                </>
              ) : null}

              {design === 2 ? (
                <>
                  <span className={styles.ruleTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  <span className={styles.ruleLine} aria-hidden="true" />
                  {low ? <span className={styles.lowBadge}>{low}</span> : null}
                </>
              ) : null}

              {design === 3 ? (
                <>
                  <span className={styles.stackIndex} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.stackTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  {low ? <span className={styles.lowBadge}>{low}</span> : null}
                </>
              ) : null}

              {design === 4 ? (
                <>
                  <span className={styles.inlineNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.inlineTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  {low ? <span className={styles.lowBadge}>{low}</span> : null}
                </>
              ) : null}

              {design === 5 ? (
                <>
                  <span className={styles.barNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.barTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  {low ? <span className={styles.lowBadge}>{low}</span> : null}
                  <span className={styles.barFill} aria-hidden="true" />
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
