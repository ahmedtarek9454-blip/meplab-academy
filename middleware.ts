import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Members-only areas (كل حاجة محتاجة حساب): a visitor without a session is sent to /login?next=…
 * Public: home, course list, each course page (free intro video, contact, waitlist), /cv-check and auth pages.
 */
const MEMBERS_ONLY = [/^\/courses\/[^/]+\/tasks/, /^\/download/, /^\/jobs/, /^\/tools/, /^\/checkout/, /^\/dashboard/, /^\/profile/, /^\/admin/];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const path = request.nextUrl.pathname;
  const membersOnly = MEMBERS_ONLY.some((re) => re.test(path));
  const signedInCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
  // Fast path: no session cookie → nothing to refresh. Public pages pass straight through,
  // members-only pages go to /login, and Supabase is never contacted.
  if (!signedInCookie) {
    if (!membersOnly) return response;
    const to = request.nextUrl.clone();
    to.pathname = '/login';
    to.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(to);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data } = await supabase.auth.getUser();

  if (!data?.user && membersOnly) {
    const to = request.nextUrl.clone();
    to.pathname = '/login';
    to.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg|ocr/|api/|.*\\.(?:png|jpg|jpeg|svg|webp|wasm|gz|js)$).*)']
};
