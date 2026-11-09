import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const pages = ['', '/courses', '/cv-check', '/jobs', '/tools', '/download'].map((p) => ({
    url: `${base}${p}`, changeFrequency: (p === '/jobs' ? 'daily' : 'weekly') as any, priority: p === '' ? 1 : 0.8
  }));
  let courses: MetadataRoute.Sitemap = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const { data } = await createClient(url, key).from('courses').select('slug, created_at').eq('published', true);
      courses = (data ?? []).map((c: any) => ({ url: `${base}/courses/${c.slug}`, lastModified: c.created_at, priority: 0.9 }));
    }
  } catch {}
  return [...pages, ...courses];
}
