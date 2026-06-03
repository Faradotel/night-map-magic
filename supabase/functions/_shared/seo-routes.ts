// Single source of truth for all SEO routes (cities, categories, genres, vibes).
// Shared between sitemap-pages and indexnow-submit so the two never drift.
// Keep slugs in sync with src/lib/seo/slug.ts.

export const SITE = 'https://pulse-map.live';

export const CITIES = [
  'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'bordeaux',
  'grenoble', 'lille', 'strasbourg', 'rennes', 'montpellier',
  'aix-en-provence', 'saint-etienne', 'villeurbanne',
];

export const CATEGORIES = [
  'concerts', 'soirees', 'festivals', 'bars', 'sport', 'culture', 'brocantes',
];

export const GENRES = ['techno', 'electro', 'house', 'rock', 'pop', 'indie', 'jazz', 'rnb'];
export const VIBES = ['rave', 'chill', 'afterwork', 'cosy', 'concert', 'culture', 'sport'];

export const LEGAL = ['privacy-policy', 'terms', 'contact-legal'];

export interface SeoRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

/**
 * Every indexable SEO route. Add a new city/category/genre/vibe to the arrays
 * above and BOTH the sitemap and IndexNow ping will include it automatically.
 */
export function getAllSeoRoutes(): SeoRoute[] {
  const routes: SeoRoute[] = [];

  routes.push({ path: '/', changefreq: 'hourly', priority: '1.0' });
  routes.push({ path: '/villes', changefreq: 'daily', priority: '0.8' });

  // Primary city pages — main intent
  for (const c of CITIES) routes.push({ path: `/villes/${c}`, changefreq: 'daily', priority: '0.9' });

  // Category index + category × city
  for (const cat of CATEGORIES) {
    routes.push({ path: `/categories/${cat}`, changefreq: 'daily', priority: '0.7' });
    for (const c of CITIES) routes.push({ path: `/categories/${cat}/${c}`, changefreq: 'daily', priority: '0.6' });
  }

  // /sortir-ce-soir/*, /ambiances/*, /genres/* intentionally excluded from sitemap.
  // Low-authority site + too many near-duplicate programmatic pages caused
  // "Détectée, actuellement non indexée" on ~1380 URLs. Pages remain reachable in-app
  // but are no longer pushed to Google. Re-add once domain authority grows.

  for (const l of LEGAL) routes.push({ path: `/${l}`, changefreq: 'monthly', priority: '0.3' });

  return routes;
}

/** Absolute URLs for all SEO routes — used by IndexNow. */
export function getAllSeoUrls(): string[] {
  return getAllSeoRoutes().map(r => `${SITE}${r.path}`);
}
