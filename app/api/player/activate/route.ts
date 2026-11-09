import type { NextRequest } from 'next/server';
import { json, fail, limited, signInPlayer, ipOf } from '@/lib/player/common';
import { generateActivationCode } from '@/lib/license';

export const dynamic = 'force-dynamic';

/**
 * POST /api/player/activate
 * Body: { email, password, machine_id, app_version? }
 * Returns the student's enrollments and, for each one bound to THIS machine, the licence.
 * See PLAYER_ONLINE_ACTIVATION.md for the full contract.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return fail('bad_request', 400); }
  if (limited(`act:${ipOf(req)}`) || limited(`act:${String(body?.email || '').toLowerCase()}`)) return fail('rate_limited', 429);

  const s = await signInPlayer(body);
  if ('err' in s) return s.err;
  const { sb, user, machine } = s;

  const { data: prof } = await sb.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle();
  const { data: orders } = await sb
    .from('orders')
    .select('id, status, machine_code, activation_code, expires_at, course_id, courses(id, slug, product_key, title_ar, title_en, download_url)')
    .eq('user_id', user.id)
    .in('status', ['approved', 'pending'])
    .order('created_at', { ascending: false });

  const { data: pendingReq } = await sb.from('device_requests').select('order_id').eq('user_id', user.id).eq('status', 'pending');
  const requested = new Set((pendingReq ?? []).map((r: any) => r.order_id));
  const today = new Date().toISOString().slice(0, 10);

  const enrollments = (orders ?? []).map((o: any) => {
    const c = o.courses || {};
    const base = {
      order_id: o.id,
      course: { id: c.id, product_key: c.product_key || c.id, slug: c.slug, title_ar: c.title_ar, title_en: c.title_en, download_url: c.download_url || null },
      expires_at: o.expires_at
    };
    if (o.status === 'pending') return { ...base, status: 'pending' };
    if (o.expires_at && o.expires_at < today) return { ...base, status: 'expired' };
    if (o.machine_code !== machine) {
      return { ...base, status: requested.has(o.id) ? 'transfer_pending' : 'other_device', device_hint: `…${String(o.machine_code).slice(-4)}` };
    }
    // bound to this machine → hand over the licence (regenerate if it was never stored)
    const license = o.activation_code || generateActivationCode({ machineCode: machine, courseId: c.product_key || c.id, expiresAt: o.expires_at });
    return { ...base, status: 'active', license };
  });

  return json({
    ok: true,
    user: { name: prof?.full_name || '', email: prof?.email || user.email },
    machine_id: machine,
    enrollments,
    server_time: new Date().toISOString()
  });
}
