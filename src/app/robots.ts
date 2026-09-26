import type { MetadataRoute } from 'next';
import { INDEXABLE, SITE_URL } from '@/lib/seo';

/** `/robots.txt`. The console, the API routes and the sign-in pages are never crawled. */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [
    {
      userAgent: '*',
      allow: '/',
      disallow: ['/app', '/api/', '/signin', '/signup', '/forgot-password', '/reset-password']
    }],

    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
