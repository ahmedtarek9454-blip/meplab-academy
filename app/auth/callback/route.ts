import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  let next = req.nextUrl.searchParams.get('next') || '/dashboard';
  if (!next.startsWith('/') || next.startsWith('//')) next = '/dashboard';
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google sign-in gives name and e-mail but no WhatsApp: ask for it once before anything else
      const { data: p } = await supabase.from('profiles').select('phone, full_name').eq('id', data.user.id).maybeSingle();
      if (!p?.phone) return NextResponse.redirect(new URL(`/profile?complete=1&next=${encodeURIComponent(next)}`, req.url));
      return NextResponse.redirect(new URL(next, req.url));
    }
  }
  return NextResponse.redirect(new URL('/login?error=1', req.url));
}
