// Daily 07:00 Cairo (05:00 UTC): retrain the CV engine from checked CVs + job posts.
export default async () => {
  const base = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  const r = await fetch(`${base}/api/ats/train`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  console.log('ats-train', r.status, await r.text());
};
export const config = { schedule: '0 5 * * *' };
