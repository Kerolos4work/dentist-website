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

export default function SessionPicker({ sessions, value, onChange }: Props) {
  const [design, setDesign] = useState<Design>(1);

  const gridClass = [
    styles.sessionGrid,
    design === 2 ? styles.sessionGridRail : '',
    design === 3 ? styles.sessionGridTile : '',
    design === 4 ? styles.sessionGridPill : '',
    design === 5 ? styles.sessionGridSplit : '',
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
          const arrival = shortTime(session.doctor_arrival_time);
          const remaining = full ? 'اكتملت' : `متبقٍ ${session.remaining}`;
          const cardClass = [
            styles.sessionCard,
            design === 2 ? styles.sessionCardRail : '',
            design === 3 ? styles.sessionCardTile : '',
            design === 4 ? styles.sessionCardPill : '',
            design === 5 ? styles.sessionCardSplit : '',
            active ? styles.sessionCardActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={session.session_start}
              type="button"
              className={cardClass}
              data-index={index}
              disabled={full}
              aria-pressed={active}
              onClick={() => onChange(session.session_start)}
            >
              {design === 1 ? (
                <>
                  <span className={styles.sessionTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  <span className={styles.sessionMeta}>وصول الطبيب {arrival}</span>
                  <span className={styles.sessionRemaining}>{remaining}</span>
                </>
              ) : null}

              {design === 2 ? (
                <>
                  <span className={styles.railNode} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.railBody}>
                    <span className={styles.sessionTime} dir="ltr">
                      {sessionRange(session)}
                    </span>
                    <span className={styles.sessionMeta}>وصول الطبيب {arrival}</span>
                    <span className={styles.sessionRemaining}>{remaining}</span>
                  </span>
                </>
              ) : null}

              {design === 3 ? (
                <>
                  <span className={styles.tileIndex}>جلسة {index + 1}</span>
                  <span className={styles.tileTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  <span className={styles.sessionMeta}>وصول الطبيب {arrival}</span>
                  <span className={styles.sessionRemaining}>{remaining}</span>
                </>
              ) : null}

              {design === 4 ? (
                <>
                  <span className={styles.pillTime} dir="ltr">
                    {sessionRange(session)}
                  </span>
                  <span className={styles.pillMeta}>وصول {arrival}</span>
                  <span className={styles.pillRemaining}>{remaining}</span>
                </>
              ) : null}

              {design === 5 ? (
                <>
                  <span className={styles.splitTime}>
                    <b dir="ltr">{sessionRange(session)}</b>
                    <span>جلسة {index + 1}</span>
                  </span>
                  <span className={styles.splitMeta}>
                    <span>وصول الطبيب {arrival}</span>
                    <span className={styles.sessionRemaining}>{remaining}</span>
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
