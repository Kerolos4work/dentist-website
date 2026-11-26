'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import type { AppointmentStatus } from '@/lib/appointments/types';
import styles from '../../booking.module.css';

type Props = {
  id: string;
  mode: 'review' | 'arrival';
};

export default function NurseActions({ id, mode }: Props) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function update(patch: {
    status?: AppointmentStatus;
    nurse_note?: string;
  }) {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setStatus('');
    const { error } = await supabase
      .from('appointments')
      .update(patch)
      .eq('id', id);
    setStatus(error ? error.message : 'تم الحفظ.');
    setBusy(false);
    if (!error) router.refresh();
  }

  return (
    <div className={styles.actions}>
      {mode === 'review' ? (
        <>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => void update({ status: 'confirmed' })}
          >
            اعتماد
          </button>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => void update({ status: 'declined' })}
          >
            رفض
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => void update({ status: 'arrived' })}
          >
            تسجيل الوصول
          </button>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => void update({ status: 'completed' })}
          >
            إنهاء
          </button>
        </>
      )}

      <input
        className={styles.input}
        value={note}
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        placeholder="ملاحظة داخلية"
        aria-label="ملاحظة داخلية للممرضة"
      />
      <button
        type="button"
        className={styles.ghost}
        disabled={busy || !note}
        onClick={() => void update({ nurse_note: note })}
      >
        حفظ الملاحظة
      </button>
      {status ? <span className={styles.cardNote}>{status}</span> : null}
    </div>
  );
}
