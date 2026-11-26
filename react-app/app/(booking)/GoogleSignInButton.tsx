'use client';

import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import { supabaseConfig } from '@/lib/supabase/config';
import styles from './booking.module.css';

type Props = {
  audience: 'staff' | 'patient';
  next: string;
  label?: string;
  variant?: 'primary' | 'ghost';
};

export default function GoogleSignInButton({
  audience,
  next,
  label = 'Google',
  variant = 'primary',
}: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function signIn() {
    const supabase = getBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus('');

    const options: {
      redirectTo: string;
      queryParams?: { hd: string };
    } = {
      redirectTo: `${window.location.origin}/auth/callback?audience=${audience}&next=${encodeURIComponent(
        next
      )}`,
    };

    // A domain hint improves the Google account picker. The callback still
    // enforces the verified database role, so the hint is never an access rule.
    if (audience === 'staff' && supabaseConfig.staffDomain) {
      options.queryParams = { hd: supabaseConfig.staffDomain };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options,
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
        className={variant === 'primary' ? styles.primary : styles.ghost}
        disabled={busy}
        onClick={() => void signIn()}
      >
        {busy ? 'جارٍ التحويل…' : label}
      </button>
      {status ? <p className={styles.message}>{status}</p> : null}
    </div>
  );
}
