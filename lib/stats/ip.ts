import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

/** anonymous visitor id: salted hash of the IP, never the IP itself */
export const ipHash = (req: NextRequest) => {
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'na';
  return createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || 'meplab-salt'}`).digest('hex').slice(0, 24);
};
