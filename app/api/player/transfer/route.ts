import type { NextRequest } from 'next/server';
import { json, fail, limited, signInPlayer, ipOf } from '@/lib/player/common';

export const dynamic = 'force-dynamic';

/**
 * POST /api/player/transfer
 * Body: { email, password, machine_id, order_id, reason? }
 * Asks the admin to move an enrollment's licence to this machine.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return fail('bad_request', 400); }
  if (limited(`tr:${ipOf(req)}`, 5)) return fail('rate_limited', 429);

  const s = await signInPlayer(body);
  if ('err' in s) return s.err;
  const { sb, user, machine } = s;
  const orderId = String(body?.order_id || '');

  const { data: o } = await sb.from('orders').select('id, status, machine_code').eq('id', orderId).eq('user_id', user.id).maybeSingle();
  if (!o || o.status !== 'approved') return fail('not_found', 404);
  if (o.machine_code === machine) return fail('already_on_this_device', 409);

  const { error } = await sb.from('device_requests').insert({
    order_id: o.id, user_id: user.id, old_machine: o.machine_code, new_machine: machine,
    reason: String(body?.reason || '').slice(0, 300) || null
  });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) return json({ ok: true, status: 'transfer_pending' });
    return fail('server_error', 500);
  }
  return json({ ok: true, status: 'transfer_pending' });
}
