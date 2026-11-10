// Daily jobs refresh (only does work when the jobs section is enabled: NEXT_PUBLIC_JOBS=1).
export default async () => {
  if (process.env.NEXT_PUBLIC_JOBS !== '1') return;
  const base = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  const r = await fetch(`${base}/api/jobs/refresh`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  console.log('jobs-refresh', r.status);
};
export const config = { schedule: '0 4 * * *' };
