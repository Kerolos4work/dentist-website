import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isStaffEmail, isSupabaseConfigured, supabaseConfig } from '@/lib/supabase/config';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/appointments';
  }
  return value;
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url);
  const code = incoming.searchParams.get('code');
  const next = safeNext(incoming.searchParams.get('next'));

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/appointments?error=auth', request.url));
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
    return NextResponse.redirect(new URL('/appointments?error=auth', request.url));
  }

  if (next.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    const role = profile?.role;

    if (
      !isStaffEmail(data.user.email ?? undefined) ||
      !['nurse', 'doctor', 'admin'].includes(role ?? '')
    ) {
      return NextResponse.redirect(
        new URL('/dashboard?error=forbidden', request.url)
      );
    }
  }

  return response;
}
