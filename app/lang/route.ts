import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to') === 'en' ? 'en' : 'ar';
  const back = req.headers.get('referer') || new URL('/', req.url).toString();
  const res = NextResponse.redirect(back);
  res.cookies.set('lang', to, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}
