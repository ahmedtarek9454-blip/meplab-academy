import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

/** anonymous visitor id: salted hash of the IP, never the IP itself */
export const ipHash = (req: NextRequest) => {
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'na';
  return createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || 'meplab-salt'}`).digest('hex').slice(0, 24);
};

/** requests that write must come from our own pages (blocks other sites posting into our counters from a visitor's browser) */
export const fromOurSite = (req: NextRequest) => {
  const o = req.headers.get('origin');
  return !o || /^https:\/\/(www\.)?meplab\.net$|^https:\/\/([\w-]+--)?meplab-academy\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
};
/** small JSON bodies only */
export const tooBig = (req: NextRequest, max = 32_000) => Number(req.headers.get('content-length') || 0) > max;

/** same visitor id from plain request headers (server actions have no NextRequest) */
export const ipHashFromHeaders = (h: Headers) => {
  const ip = (h.get('x-nf-client-connection-ip') || h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'na';
  return createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || 'meplab-salt'}`).digest('hex').slice(0, 24);
};
