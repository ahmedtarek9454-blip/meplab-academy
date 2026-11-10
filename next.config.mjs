// Hosting integrations name the Supabase variables differently:
// Vercel's integration uses NEXT_PUBLIC_SUPABASE_URL, Netlify's Supabase extension
// uses SUPABASE_DATABASE_URL / NEXT_PUBLIC_SUPABASE_DATABASE_URL. Map them once here
// so the app always reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const supabaseAnon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
// Netlify sets URL to the production address; use it when NEXT_PUBLIC_SITE_URL is not set.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '6mb' } // receipts upload
  },
  eslint: { ignoreDuringBuilds: true },
  env: {
    ...(supabaseUrl ? { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl } : {}),
    ...(supabaseAnon ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon } : {}),
    ...(siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {})
  }
};

export default nextConfig;
