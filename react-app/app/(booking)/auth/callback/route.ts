import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isBlockedEmail,
  isStaffEmail,
  isSupabaseConfigured,
  supabaseConfig,
} from '@/lib/supabase/config';

type Audience = 'staff' | 'patient';

function audienceFor(value: string | null): Audience {
  return value === 'staff' ? 'staff' : 'patient';
}

function safeNext(value: string | null, audience: Audience) {
  const fallback = audience === 'staff' ? '/dashboard' : '/my-appointments';
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  if (audience === 'staff') {
    return value.startsWith('/dashboard') ? value : fallback;
  }

  return value === '/appointments' || value === '/my-appointments'
    ? value
    : fallback;
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url);
  const code = incoming.searchParams.get('code');
  const audience = audienceFor(incoming.searchParams.get('audience'));
  const next = safeNext(incoming.searchParams.get('next'), audience);
  const authError =
    audience === 'staff' ? '/dashboard?error=auth' : '/my-appointments?error=auth';
  const blockedError =
    audience === 'staff'
      ? '/dashboard?error=blocked'
      : '/my-appointments?error=blocked';

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(authError, request.url));
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items) {
          items.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL(authError, request.url));
  }

  // Return a fresh redirect without the exchanged session cookies so the
  // blocked identity is never persisted in this browser.
  const email = data.user.email ?? undefined;
  if (isBlockedEmail(email)) {
    return NextResponse.redirect(new URL(blockedError, request.url));
  }

  if (audience === 'staff') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    const role = profile?.role;
    const domainAllowed =
      !supabaseConfig.staffDomain ||
      isStaffEmail(email);
    const roleAllowed = ['nurse', 'doctor', 'admin'].includes(role ?? '');

    if (!domainAllowed || !roleAllowed) {
      return NextResponse.redirect(
        new URL('/dashboard?error=forbidden', request.url)
      );
    }
  }

  return response;
}
