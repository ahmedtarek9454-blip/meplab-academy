import { ROLES, MARKETS, type Market } from '@/lib/cv/data';

/**
 * =====================================================================
 *  جلب الوظايف أوتوماتيك
 *  - Jooble (مجاني): JOOBLE_API_KEY  — https://jooble.org/api/about
 *  - JSearch (اختياري، خطة مجانية محدودة): RAPIDAPI_KEY
 * =====================================================================
 */

export type JobRow = {
  id: string;
  source: string;
  title: string;
  company: string | null;
  location: string | null;
  market: Market;
  role_id: string | null;
  snippet: string | null;
  salary: string | null;
  url: string;
  posted_at: string | null;
  fetched_at: string;
  active: boolean;
};

const strip = (s?: string | null) =>
  (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** quick filter: keep only engineering/MEP-looking titles */
const RELEVANT = /(hvac|mep|mechanical|bim|revit|fire|plumbing|sprinkler|estimat|technical office|shop drawing|maintenance|facilit|chiller|ventilation|air.?condition|ميكانيك|تكييف|حريق)/i;

async function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

async function jooble(query: string, market: Market, roleId: string): Promise<JobRow[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  const res = await withTimeout(fetch(`https://jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: query, location: MARKETS[market].location, page: '1', ResultOnPage: '20' }),
    cache: 'no-store'
  }));
  if (!res.ok) throw new Error(`jooble ${res.status}`);
  const data = await res.json();
  const now = new Date().toISOString();
  return (data.jobs || []).map((j: any) => ({
    id: `jooble:${j.id}`,
    source: 'jooble',
    title: strip(j.title),
    company: strip(j.company) || null,
    location: strip(j.location) || MARKETS[market].location,
    market,
    role_id: roleId,
    snippet: strip(j.snippet).slice(0, 1500) || null,
    salary: strip(j.salary) || null,
    url: j.link,
    posted_at: j.updated ? new Date(j.updated).toISOString() : null,
    fetched_at: now,
    active: true
  }));
}

async function jsearch(query: string, market: Market, roleId: string): Promise<JobRow[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];
  const u = new URL('https://jsearch.p.rapidapi.com/search');
  u.searchParams.set('query', `${query} in ${MARKETS[market].location}`);
  u.searchParams.set('page', '1');
  u.searchParams.set('num_pages', '1');
  u.searchParams.set('date_posted', 'week');
  u.searchParams.set('country', MARKETS[market].cc);
  const res = await withTimeout(fetch(u, {
    headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
    cache: 'no-store'
  }));
  if (!res.ok) throw new Error(`jsearch ${res.status}`);
  const data = await res.json();
  const now = new Date().toISOString();
  return (data.data || []).map((j: any) => {
    const sal = j.job_min_salary && j.job_max_salary ? `${j.job_min_salary}–${j.job_max_salary} ${j.job_salary_currency || ''}`.trim() : null;
    return {
      id: `jsearch:${j.job_id}`,
      source: j.job_publisher || 'jsearch',
      title: strip(j.job_title),
      company: j.employer_name || null,
      location: [j.job_city, j.job_country].filter(Boolean).join(', ') || MARKETS[market].location,
      market,
      role_id: roleId,
      snippet: strip(j.job_description).slice(0, 1500) || null,
      salary: sal,
      url: j.job_apply_link || j.job_google_link,
      posted_at: j.job_posted_at_datetime_utc || null,
      fetched_at: now,
      active: true
    };
  });
}

/** run tasks with limited concurrency */
async function pool<T>(tasks: (() => Promise<T>)[], n = 6) {
  const out: PromiseSettledResult<T>[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tasks.length) {
      const k = i++;
      try { out[k] = { status: 'fulfilled', value: await tasks[k]() }; }
      catch (e: any) { out[k] = { status: 'rejected', reason: e }; }
    }
  }));
  return out;
}

export async function fetchAllJobs() {
  const markets = Object.keys(MARKETS) as Market[];
  const tasks: (() => Promise<JobRow[]>)[] = [];
  for (const m of markets) {
    for (const r of ROLES) {
      // Jooble: first query of every role in every market
      tasks.push(() => jooble(r.q[0], m, r.id));
    }
    // JSearch has a small free quota: 3 main roles per market, only on some weekdays
    // (default Mon & Thu = ~80 calls/month). Change with JSEARCH_DAYS="0,1,2,3,4,5,6".
    const days = (process.env.JSEARCH_DAYS || '1,4').split(',').map((d) => parseInt(d, 10));
    if (days.includes(new Date().getUTCDay())) {
      for (const r of ROLES.filter((x) => ['hvac_design', 'bim', 'site'].includes(x.id))) {
        tasks.push(() => jsearch(r.q[0], m, r.id));
      }
    }
  }
  const results = await pool(tasks, 6);
  const errors = results.filter((r) => r.status === 'rejected').map((r: any) => String(r.reason?.message || r.reason));
  const seen = new Map<string, JobRow>();
  const ids = new Set<string>();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const j of r.value) {
      if (!j.url || !j.title || !RELEVANT.test(j.title)) continue;
      // de-duplicate same title+company+market from different sources
      const k = `${j.market}|${j.title.toLowerCase()}|${(j.company || '').toLowerCase()}`;
      if (!seen.has(k) && !ids.has(j.id)) { seen.set(k, j); ids.add(j.id); }
    }
  }
  return { jobs: [...seen.values()], errors, calls: tasks.length };
}
