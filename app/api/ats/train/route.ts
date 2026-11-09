import { NextResponse, type NextRequest } from 'next/server';
import { trainAndSave } from '@/lib/ats/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** weekly training (Vercel Cron, see vercel.json). Protected by CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try { return NextResponse.json(await trainAndSave()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
