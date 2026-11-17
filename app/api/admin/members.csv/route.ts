import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** every member with name, e-mail, WhatsApp, title and courses — opens in Excel (UTF-8 with BOM for Arabic) */
export async function GET() {
  const { isAdmin } = await getSession();
  if (!isAdmin) return new NextResponse('Forbidden', { status: 403 });
  const admin = createAdminClient();
  const [{ data: ps }, { data: os }] = await Promise.all([
    admin.from('profiles').select('id, created_at, full_name, email, phone, job_title, company, years, market, last_ats').order('created_at', { ascending: false }),
    admin.from('orders').select('user_id, courses(title_ar)').eq('status', 'approved')
  ]);
  const courses = (id: string) => (os ?? []).filter((o: any) => o.user_id === id).map((o: any) => o.courses?.title_ar).filter(Boolean).join(' | ');
  // a leading = + - @ would run as a formula in Excel: neutralise it
  const cell = (v: any) => { let s = v == null ? '' : String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const head = ['تاريخ التسجيل', 'الاسم', 'الإيميل', 'واتساب', 'المسمى', 'الشركة', 'سنين الخبرة', 'السوق', 'آخر درجة ATS', 'الكورسات'];
  const rows = (ps ?? []).map((p: any) => [p.created_at?.slice(0, 10), p.full_name, p.email, p.phone, p.job_title, p.company, p.years, p.market, p.last_ats, courses(p.id)].map(cell).join(','));
  const csv = '﻿' + [head.map(cell).join(','), ...rows].join('\r\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="meplab-members-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
}
