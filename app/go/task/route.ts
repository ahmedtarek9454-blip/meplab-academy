import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Fixed link the MEP LAB Player opens when the student presses "submit the task":
 *   https://meplab.net/go/task?course=<course name or slug>&lesson=<video title>
 * → signs in if needed (middleware), then lands on that course's tasks page, at the lesson's task when one matches.
 */
const norm = (s: string) => s.toLowerCase().normalize('NFKD')
  .replace(/^\s*\d+\s*[-_.)]\s*/, '')          // "01-Pipe Intro" → "pipe intro"
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 1));
const overlap = (a: string, b: string) => { const A = words(a), B = words(b); let n = 0; A.forEach((w) => { if (B.has(w)) n++; }); return n / Math.max(1, Math.min(A.size, B.size)); };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const course = (q.get('course') || '').slice(0, 120);
  const lesson = (q.get('lesson') || '').slice(0, 160);
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin));

  const { supabase, user } = await getSession();
  if (!user) return to(`/login?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`);

  const { data: orders } = await supabase.from('orders').select('courses(id, slug, title_ar, title_en)').eq('user_id', user.id).eq('status', 'approved');
  const mine = (orders ?? []).map((o: any) => o.courses).filter(Boolean);
  if (!mine.length) return to('/profile?need_course=1#details');

  let pick = mine.length === 1 ? mine[0] : null;
  if (course) {
    const scored = mine.map((c: any) => ({ c, s: Math.max(norm(c.slug) === norm(course) ? 1 : 0, overlap(course, c.slug.replace(/-/g, ' ')), overlap(course, c.title_en || ''), overlap(course, c.title_ar || '')) }))
      .sort((a: any, b: any) => b.s - a.s);
    if (scored[0].s > 0) pick = scored[0].c;
  }
  if (!pick) return to('/profile#my-courses');

  let hash = '';
  if (lesson) {
    const { data: tasks } = await supabase.from('course_tasks').select('id, title_ar, title_en').eq('course_id', pick.id).eq('published', true);
    const best = (tasks ?? []).map((t: any) => ({ t, s: Math.max(overlap(lesson, t.title_en || ''), overlap(lesson, t.title_ar || '')) })).sort((a: any, b: any) => b.s - a.s)[0];
    if (best && best.s >= 0.5) hash = `#task-${best.t.id}`;
  }
  return to(`/courses/${pick.slug}/tasks${hash}`);
}
