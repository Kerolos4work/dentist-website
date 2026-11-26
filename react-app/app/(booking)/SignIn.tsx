'use client';

import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import styles from './booking.module.css';

export default function SignIn({ next }: { next: string }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(provider: 'google' | 'azure') {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });
    if (error) {
      setStatus(error.message);
      setBusy(false);
    }
  }

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.primary}
        disabled={busy}
        onClick={() => void signIn('google')}
      >
        Google
      </button>
      <button
        type="button"
        className={styles.ghost}
        disabled={busy}
        onClick={() => void signIn('azure')}
      >
        Microsoft
      </button>
      {status ? <p className={styles.message}>{status}</p> : null}
    </div>
  );
}
