'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import styles from '../booking.module.css';

export default function AppointmentActions({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function cancel() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) {
      setStatus(error.message);
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.ghost}
        disabled={busy}
        onClick={() => void cancel()}
      >
        {busy ? 'جارٍ الإلغاء…' : 'إلغاء الموعد'}
      </button>
      {status ? <p className={styles.message}>{status}</p> : null}
    </div>
  );
}
