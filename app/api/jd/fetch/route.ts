import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

/** job boards we read; anything else is refused (no open proxy) */
const HOSTS = /(^|\.)(linkedin\.com|bayt\.com|wuzzuf\.net|indeed\.com|naukrigulf\.com|gulftalent\.com|glassdoor\.com|forasna\.com|drjobpro\.com|tanqeeb\.com|akhtaboot\.com|dubizzle\.com|monster\.com|jobs\.ps|foundit\.in|careerjet\.[a-z.]+|recruit\.net|jooble\.org)$/i;

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const toText = (html: string) => decode(html
  .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|tr|ul|ol|section)>/gi, '\n').replace(/<li[^>]*>/gi, '\n- ')
  .replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*/g, '\n').trim();

function fromJsonLd(html: string) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1].trim());
      const list = Array.isArray(j) ? j : j['@graph'] || [j];
      const p = list.find((x: any) => /JobPosting/i.test(String(x['@type'])));
      if (p?.description) return { title: p.title || '', company: p.hiringOrganization?.name || '', text: toText(String(p.description)) };
    } catch {}
  }
  return null;
}

async function get(url: string, tries = 3): Promise<string> {
  for (let i = 0; ; i++) {
    try { return await get1(url); } catch (e) { if (i >= tries - 1) throw e; await new Promise((res) => setTimeout(res, 700 * (i + 1))); } // LinkedIn answers 429 now and then
  }
}
async function get1(url: string) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8', Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(String(r.status));
  return (await r.text()).slice(0, 2_000_000);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  let u: URL;
  try { u = new URL(String(b?.url || '').trim()); } catch { return NextResponse.json({ error: 'bad_url' }, { status: 400 }); }
  if (u.protocol !== 'https:' || !HOSTS.test(u.hostname)) return NextResponse.json({ error: 'site' }, { status: 400 });
  try {
    let title = '', company = '', text = '';
    if (/linkedin\.com$/i.test(u.hostname)) {
      // the public job page; works for /jobs/view/123 and ?currentJobId=123 links
      const id = u.pathname.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})/)?.[1] || u.searchParams.get('currentJobId');
      if (!id) return NextResponse.json({ error: 'not_job' }, { status: 400 });
      const html = await get(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`);
      title = toText(html.match(/<h2[^>]*top-card-layout__title[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '');
      company = toText(html.match(/topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/i)?.[1] || '');
      text = toText(html.match(/show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '');
      const crit = toText(html.match(/<ul[^>]*description__job-criteria-list[^>]*>([\s\S]*?)<\/ul>/i)?.[1] || '');
      if (crit) text += '\n' + crit;
    } else {
      const html = await get(u.toString());
      const ld = fromJsonLd(html);
      if (ld) ({ title, company, text } = ld);
      else {
        title = toText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
        const main = html.match(/<(main|article)[\s\S]*?<\/\1>/i)?.[0] || html;
        text = toText(main);
      }
    }
    text = text.slice(0, 12000);
    if (text.length < 120) return NextResponse.json({ error: 'empty' }, { status: 422 });
    const head = [title, company && `Company: ${company}`].filter(Boolean).join('\n');
    return NextResponse.json({ title, company, text: `${head}\n\n${text}`.trim() });
  } catch (e: any) {
    return NextResponse.json({ error: 'fetch', detail: String(e?.message || e).slice(0, 60) }, { status: 502 });
  }
}
