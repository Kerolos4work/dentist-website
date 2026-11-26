'use client';

import GoogleSignInButton from './GoogleSignInButton';

// Staff sign-in is deliberately separate from patient sign-in. Reaching the
// dashboard still requires a verified nurse/doctor/admin role in `profiles`.
export default function SignIn({ next }: { next: string }) {
  return (
    <GoogleSignInButton
      audience="staff"
      next={next}
      label="Google Workspace"
    />
  );
}
