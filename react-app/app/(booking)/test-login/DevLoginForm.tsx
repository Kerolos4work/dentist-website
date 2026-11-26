'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import styles from '../booking.module.css';

export default function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="dev-email">
          البريد الإلكتروني
        </label>
        <input
          id="dev-email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          className={styles.input}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="dev-password">
          كلمة المرور
        </label>
        <input
          id="dev-password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className={styles.input}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {status ? <p className={`${styles.message} ${styles.error}`}>{status}</p> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? 'جارٍ الدخول…' : 'دخول'}
        </button>
      </div>
    </form>
  );
}
