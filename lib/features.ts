// Turn the jobs section back on by setting NEXT_PUBLIC_JOBS=1 in Vercel (then redeploy).
export const JOBS_ENABLED = process.env.NEXT_PUBLIC_JOBS === '1';

/** Course prices are hidden until NEXT_PUBLIC_SHOW_PRICES=1 is set on the host. */
export const SHOW_PRICES = process.env.NEXT_PUBLIC_SHOW_PRICES === '1';
