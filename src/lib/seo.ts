import type { Metadata } from 'next';

/**
 * Search and link-preview metadata for the public site.
 *
 * `NEXT_PUBLIC_SITE_URL` is the site's public address — canonical URLs, the
 * sitemap and link previews are all built from it, so it must be the real
 * domain in production. Like every NEXT_PUBLIC_* value it is inlined at build
 * time: in Dokploy it is a Build Argument.
 *
 * `NEXT_PUBLIC_NOINDEX=true` keeps a deployment out of search results (a
 * staging copy, say) without touching anything else.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dutycaptain.com').replace(/\/+$/, '');
export const INDEXABLE = process.env.NEXT_PUBLIC_NOINDEX !== 'true';

export const SITE_NAME = 'DutyCaptain';
/** The one public address for now: sales, support, privacy and legal. */
export const CONTACT_EMAIL = 'info@dutycaptain.com';
export const SITE_TAGLINE = 'Describe the task. DutyCaptain does the work.';
export const SITE_DESCRIPTION =
'DutyCaptain plans your routine work, carries out each step by the most reliable route — built-in tools, connected services, websites or your own computer — checks the result, and asks before anything that matters.';

/**
 * Metadata for one public page: its title, description, canonical URL and the
 * matching link-preview fields. The preview image comes from
 * `app/opengraph-image.tsx` for every page.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false





}: {title: string;description: string;path: string;absoluteTitle?: boolean;}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  // Named explicitly: a page that sets its own `openGraph` replaces the
  // site-wide one, image included, so without this marketing pages would be
  // shared with no picture.
  const image = { url: '/opengraph-image', width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_GB',
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.url]
    }
  };
}

/** For pages that should never appear in search results. */
export const NOINDEX: Metadata['robots'] = { index: false, follow: false };
