import { NextResponse, type NextRequest } from 'next/server';
import { refreshJobs } from '@/lib/jobs/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Called once a day by Vercel Cron (see vercel.json). Protected by CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await refreshJobs());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
