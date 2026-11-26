const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
// Publishable keys are the current replacement for legacy anon keys.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabaseConfig = {
  url: url ?? '',
  anonKey: anonKey ?? '',
  staffDomain: process.env.NEXT_PUBLIC_CLINIC_DOMAIN?.trim().toLowerCase() ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'http://localhost:3000',
};

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

export function isStaffEmail(email: string | undefined) {
  if (!email || !supabaseConfig.staffDomain) return false;
  return email.toLowerCase().endsWith(`@${supabaseConfig.staffDomain}`);
}
