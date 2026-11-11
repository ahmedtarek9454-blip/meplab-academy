import { JOBS_ENABLED } from '@/lib/features';
import type { MetadataRoute } from 'next';
import { safeCourses } from '@/lib/data/courses';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const pages = ['', '/courses', '/cv-check', ...(JOBS_ENABLED ? ['/jobs'] : [])].map((p) => ({
    url: `${base}${p}`, changeFrequency: (p === '/jobs' ? 'daily' : 'weekly') as any, priority: p === '' ? 1 : 0.8
  }));
  // same source as the course pages (database, or the built-in catalog until it is connected)
  const courses: MetadataRoute.Sitemap = (await safeCourses()).map((c: any) => ({
    url: `${base}/courses/${c.slug}`, changeFrequency: 'weekly' as any, priority: c.status === 'soon' ? 0.6 : 0.9
  }));
  return [...pages, ...courses];
}
