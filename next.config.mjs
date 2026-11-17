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

// Security headers on every response. The CSP allows only what the site really loads:
// our own files, Supabase (login, storage), the video players we embed, WebAssembly for the OCR reader.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://drive.google.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://*.supabase.co",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests'
].join('; ');
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // the CV builder records your voice on this site only; nothing else may use the camera, location or payments
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // API answers are never cached by a shared cache unless the route says so, and never sniffed as HTML
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }
    ];
  },
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
