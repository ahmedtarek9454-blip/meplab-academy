import { unstable_cache } from 'next/cache';
import { createClient as createPlain } from '@supabase/supabase-js';
import { SUPABASE_ANON, SUPABASE_READY, SUPABASE_URL } from '@/lib/supabase/env';

/**
 * Public course data is the same for every visitor, so it is read with a cookie-less
 * anon client and cached for 5 minutes (admin edits call revalidateTag('courses')).
 * This keeps the home, course list, course page and CV page off the database on almost every request.
 */
const timedFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4000) });

function anon() {
  return createPlain(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { retry: false } as any, // the client otherwise retries for 1s+2s+4s before giving up
    global: { fetch: timedFetch }
  });
}

// If the database just failed, don't make every visitor wait for it again for a minute.
let downUntil = 0;

export const getPublishedCourses = unstable_cache(
  async (): Promise<any[]> => {
    if (!SUPABASE_READY) return [];
    const { data, error } = await anon().from('courses').select('*').eq('published', true).order('sort_order');
    if (error) throw error; // don't cache a failure
    return data ?? [];
  },
  ['published-courses'],
  { revalidate: 300, tags: ['courses'] }
);

export const getCourseBySlug = unstable_cache(
  async (slug: string): Promise<any | null> => {
    if (!SUPABASE_READY) return null;
    const { data, error } = await anon().from('courses').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
  ['course-by-slug'],
  { revalidate: 300, tags: ['courses'] }
);

/** Never let a database hiccup take a public page down: fall back to an empty list. */
export async function safeCourses() {
  if (Date.now() < downUntil) return [];
  try { return await getPublishedCourses(); } catch { downUntil = Date.now() + 60_000; return []; }
}
