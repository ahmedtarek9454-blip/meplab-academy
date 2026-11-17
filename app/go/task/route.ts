import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Fixed link the MEP LAB Player opens when the student presses "submit the task":
 *   https://meplab.net/go/task?course=<course name or slug>&lesson=<video title>
 * Tasks are handed in on Google Classroom, so this sends the student to the Classroom link
 * Hamada set for that course in /admin/courses. Changing the class = changing that link; the Player never changes.
 * No sign-in needed here (students already made their account to download the Player).
 */
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 1));
const overlap = (a: string, b: string) => { const A = words(a), B = words(b); let n = 0; A.forEach((w) => { if (B.has(w)) n++; }); return n / Math.max(1, Math.min(A.size, B.size)); };

export async function GET(req: NextRequest) {
  const course = (req.nextUrl.searchParams.get('course') || '').slice(0, 120);
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin));

  let list: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('courses').select('slug, title_ar, title_en, classroom_url').eq('published', true);
    list = data ?? [];
  } catch { list = []; }
  const withLink = list.filter((c) => c.classroom_url);

  let pick: any = null;
  if (course) {
    const best = list.map((c) => ({ c, s: Math.max(norm(c.slug) === norm(course) ? 1 : 0, overlap(course, c.slug.replace(/-/g, ' ')), overlap(course, c.title_en || ''), overlap(course, c.title_ar || '')) }))
      .sort((a, b) => b.s - a.s)[0];
    if (best && best.s > 0) pick = best.c;
  }
  if (!pick?.classroom_url && withLink.length === 1) pick = withLink[0];   // one class running → that's it
  if (pick?.classroom_url) return NextResponse.redirect(pick.classroom_url);
  return to(pick ? `/courses/${pick.slug}` : '/courses');
}
