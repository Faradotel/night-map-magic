// Single source of truth for all SEO routes (cities, categories, genres, vibes).
// Shared between sitemap generator (scripts/generate-sitemap.ts) and IndexNow
// (supabase/functions/indexnow-submit) so the two never drift.
// Keep slugs in sync with src/lib/seo/slug.ts.

export const SITE = 'https://pulse-map.live';

// ---------------------------------------------------------------------------
// 3-tier city segmentation
// Tier 1 = grandes villes (métropoles nationales) — crawl prioritaire
// Tier 2 = villes intermédiaires (préfectures et grandes tourism/culture)
// Tier 3 = autres (banlieues + sous-préfectures + destinations touristiques)
// ---------------------------------------------------------------------------

export const CITIES_TIER_1 = [
  'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'bordeaux',
  'grenoble', 'lille', 'strasbourg', 'rennes', 'montpellier',
  'aix-en-provence', 'saint-etienne', 'villeurbanne',
];

export const CITIES_TIER_2 = [
  'reims', 'toulon', 'le-havre', 'angers', 'dijon', 'brest', 'nimes',
  'clermont-ferrand', 'le-mans', 'tours', 'limoges', 'perpignan',
  'metz', 'besancon', 'orleans', 'rouen', 'mulhouse', 'caen', 'nancy',
  'amiens', 'avignon', 'poitiers', 'la-rochelle', 'annecy', 'chambery',
  'pau', 'bayonne', 'biarritz', 'valence', 'cannes', 'antibes',
  'ajaccio', 'bastia', 'colmar', 'troyes',
];

export const CITIES_TIER_3 = [
  'bourges', 'chartres', 'niort', 'angouleme', 'beziers', 'narbonne',
  'dunkerque', 'roubaix', 'tourcoing', 'lorient', 'vannes', 'quimper',
  'saint-nazaire', 'cherbourg', 'versailles',
  'boulogne-billancourt', 'saint-denis', 'montreuil', 'argenteuil', 'nanterre',
  'creteil', 'courbevoie', 'aubervilliers', 'neuilly-sur-seine',
  'issy-les-moulineaux', 'levallois-perret', 'asnieres-sur-seine',
  'rueil-malmaison', 'antony', 'ivry-sur-seine',
  'cholet', 'la-roche-sur-yon', 'blois', 'saint-malo', 'saint-brieuc',
  'arras', 'valenciennes', 'calais', 'boulogne-sur-mer', 'beauvais',
  'compiegne', 'auxerre', 'nevers', 'vichy', 'macon', 'chalon-sur-saone',
  'annemasse', 'thonon-les-bains', 'chamonix', 'menton', 'frejus', 'hyeres',
  'martigues', 'arles', 'carcassonne', 'sete', 'montauban', 'albi',
  'castres', 'tarbes', 'perigueux', 'brive-la-gaillarde', 'evreux',
  'rodez', 'epinal',
];

/** Flat list of every city slug (backwards compat with older imports). */
export const CITIES = [...CITIES_TIER_1, ...CITIES_TIER_2, ...CITIES_TIER_3];

export const CATEGORIES = [
  'concerts', 'soirees', 'festivals', 'bars', 'sport', 'culture', 'brocantes',
];

export const GENRES = ['techno', 'electro', 'house', 'rock', 'pop', 'indie', 'jazz', 'rnb'];
export const VIBES = ['rave', 'chill', 'afterwork', 'cosy', 'concert', 'culture', 'sport'];

export const LEGAL = ['privacy-policy', 'terms', 'contact-legal'];

export type Tier = 1 | 2 | 3;

export interface SeoRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

// Priorité + fréquence de crawl décroissantes selon le tier.
// Google alloue son budget de crawl aux URLs prioritaires en premier.
const TIER_CONFIG: Record<Tier, { cityPr: string; catPr: string; tagPr: string; cf: SeoRoute['changefreq'] }> = {
  1: { cityPr: '1.0', catPr: '0.9', tagPr: '0.8', cf: 'daily' },
  2: { cityPr: '0.7', catPr: '0.6', tagPr: '0.5', cf: 'daily' },
  3: { cityPr: '0.5', catPr: '0.4', tagPr: '0.3', cf: 'weekly' },
};

function citiesForTier(tier: Tier): string[] {
  if (tier === 1) return CITIES_TIER_1;
  if (tier === 2) return CITIES_TIER_2;
  return CITIES_TIER_3;
}

/** Routes for a single tier — city page + categories × city + genres × city + vibes × city. */
export function getSeoRoutesForTier(tier: Tier): SeoRoute[] {
  const cfg = TIER_CONFIG[tier];
  const cities = citiesForTier(tier);
  const routes: SeoRoute[] = [];

  // Static top-level routes belong to tier 1 only (crawled once, not per-city).
  if (tier === 1) {
    routes.push({ path: '/', changefreq: 'hourly', priority: '1.0' });
    routes.push({ path: '/villes', changefreq: 'daily', priority: '0.9' });
    for (const cat of CATEGORIES) routes.push({ path: `/categories/${cat}`, changefreq: 'daily', priority: '0.8' });
    for (const g of GENRES) routes.push({ path: `/genres/${g}`, changefreq: 'weekly', priority: '0.6' });
    for (const v of VIBES) routes.push({ path: `/ambiances/${v}`, changefreq: 'weekly', priority: '0.6' });
    for (const l of LEGAL) routes.push({ path: `/${l}`, changefreq: 'monthly', priority: '0.3' });
  }

  // Canonical city pages — /sortir-ce-soir/<slug>
  for (const c of cities) {
    routes.push({ path: `/sortir-ce-soir/${c}`, changefreq: cfg.cf, priority: cfg.cityPr });
  }

  // Category × ville (canonical URL for "soirée <ville>", "concert <ville>", etc.)
  for (const cat of CATEGORIES) {
    for (const c of cities) routes.push({ path: `/categories/${cat}/${c}`, changefreq: cfg.cf, priority: cfg.catPr });
  }

  // Genres × villes (longue traîne)
  for (const g of GENRES) {
    for (const c of cities) routes.push({ path: `/genres/${g}/${c}`, changefreq: 'weekly', priority: cfg.tagPr });
  }

  // Ambiances × villes (longue traîne)
  for (const v of VIBES) {
    for (const c of cities) routes.push({ path: `/ambiances/${v}/${c}`, changefreq: 'weekly', priority: cfg.tagPr });
  }

  return routes;
}

/**
 * Every indexable SEO route across all tiers.
 * Kept for backwards compat with any code that expects a flat list.
 */
export function getAllSeoRoutes(): SeoRoute[] {
  return [
    ...getSeoRoutesForTier(1),
    ...getSeoRoutesForTier(2),
    ...getSeoRoutesForTier(3),
  ];
}

/** Absolute URLs for all SEO routes — used by IndexNow. */
export function getAllSeoUrls(): string[] {
  return getAllSeoRoutes().map(r => `${SITE}${r.path}`);
}
