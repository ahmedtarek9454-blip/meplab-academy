/** Supabase is configured only when both public values exist (they are inlined at build time). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_READY = Boolean(SUPABASE_URL && SUPABASE_ANON);

/** A Supabase auth cookie looks like sb-<ref>-auth-token (possibly chunked .0/.1). */
export function hasAuthCookie(names: string[]) {
  return names.some((n) => n.startsWith('sb-') && n.includes('-auth-token'));
}
