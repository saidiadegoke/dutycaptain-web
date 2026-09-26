import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/** `/sitemap.xml` — the public pages only. */
const PAGES: {path: string;priority: number;changeFrequency: 'weekly' | 'monthly' | 'yearly';}[] = [
{ path: '/', priority: 1, changeFrequency: 'weekly' },
{ path: '/platform', priority: 0.9, changeFrequency: 'monthly' },
{ path: '/use-cases', priority: 0.8, changeFrequency: 'monthly' },
{ path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
{ path: '/security', priority: 0.7, changeFrequency: 'monthly' },
{ path: '/deployment', priority: 0.7, changeFrequency: 'weekly' },
{ path: '/developers', priority: 0.6, changeFrequency: 'monthly' },
{ path: '/company', priority: 0.6, changeFrequency: 'monthly' },
{ path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
{ path: '/terms', priority: 0.3, changeFrequency: 'yearly' }];


export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((p) => ({
    url: `${SITE_URL}${p.path === '/' ? '' : p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority
  }));
}
