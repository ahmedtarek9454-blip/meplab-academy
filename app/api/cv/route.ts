import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const MAX = 10 * 1024 * 1024;
const OK = /\.(pdf|docx?|png|jpe?g|webp|txt)$/i;

/** GET → signed download URL of the member's saved CV. POST (multipart "file") → save/replace it. DELETE → remove it. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });
  const { data: p } = await supabase.from('profiles').select('cv_path, cv_name, cv_updated_at').eq('id', user.id).maybeSingle();
  if (!p?.cv_path) return NextResponse.json({ cv: null });
  const { data } = await supabase.storage.from('cvs').createSignedUrl(p.cv_path, 600, { download: p.cv_name || undefined });
  return NextResponse.json({ cv: { name: p.cv_name, updated_at: p.cv_updated_at, url: data?.signedUrl || null } });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });
  const fd = await req.formData().catch(() => null);
  const file = fd?.get('file') as File | null;
  if (!file || !file.size) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'too_big' }, { status: 400 });
  if (!OK.test(file.name)) return NextResponse.json({ error: 'bad_type' }, { status: 400 });

  const { data: prev } = await supabase.from('profiles').select('cv_path').eq('id', user.id).maybeSingle();
  const ext = (file.name.match(/\.(\w+)$/)?.[1] || 'pdf').toLowerCase();
  const path = `${user.id}/cv-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('cvs').upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  const now = new Date().toISOString();
  const { error } = await supabase.from('profiles').update({ cv_path: path, cv_name: file.name.slice(0, 120), cv_updated_at: now, updated_at: now }).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (prev?.cv_path && prev.cv_path !== path) await supabase.storage.from('cvs').remove([prev.cv_path]).catch(() => {});
  return NextResponse.json({ ok: true, name: file.name, updated_at: now });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });
  const { data: p } = await supabase.from('profiles').select('cv_path').eq('id', user.id).maybeSingle();
  if (p?.cv_path) await supabase.storage.from('cvs').remove([p.cv_path]).catch(() => {});
  await supabase.from('profiles').update({ cv_path: null, cv_name: null, cv_updated_at: null }).eq('id', user.id);
  return NextResponse.json({ ok: true });
}
