import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { supabase, isAdmin } = await getSession();
  if (!isAdmin) return new NextResponse('forbidden', { status: 403 });
  const { data } = await supabase.from('leads').select('full_name, email, role_id, market, ats_score, years, level, source, created_at').order('created_at', { ascending: false }).limit(10000);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['name', 'email', 'role', 'market', 'ats_score', 'years', 'level', 'source', 'created_at'].join(',')]
    .concat((data ?? []).map((r: any) => [r.full_name, r.email, r.role_id, r.market, r.ats_score, r.years, r.level, r.source, r.created_at].map(esc).join(',')));
  return new NextResponse('﻿' + rows.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="meplab-leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
