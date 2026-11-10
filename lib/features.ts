// Turn the jobs section back on by setting NEXT_PUBLIC_JOBS=1 in Vercel (then redeploy).
export const JOBS_ENABLED = process.env.NEXT_PUBLIC_JOBS === '1';
