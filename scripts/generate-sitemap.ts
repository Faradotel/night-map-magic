// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes a 3-tier sitemap index + one urlset per tier so Googlebot crawls
// the highest-priority URLs first.
//
// Outputs:
//   public/sitemap.xml           — sitemap index (references the 3 tiers + events)
//   public/sitemap-tier1.xml     — grandes villes (top 15)
//   public/sitemap-tier2.xml     — villes intermédiaires (~35)
//   public/sitemap-tier3.xml     — autres villes (~65)
//
// public/sitemap-events.xml is generated separately by the Supabase edge
// function `sitemap-events` (cron-driven) — this script never touches it.

import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  SITE,
  getSeoRoutesForTier,
  type SeoRoute,
  type Tier,
} from '../supabase/functions/_shared/seo-routes.ts';
import { CITY_SLUGS, CATEGORY_SLUGS, GENRE_SLUGS, VIBE_SLUGS, slugify } from '../src/lib/seo/slug.ts';

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

// Fetch URLs marked as retired so we can exclude them from every tier sitemap.
async function fetchRetiredUrls(): Promise<Set<string>> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Set();
  try {
    const r = await fetch(`${url}/rest/v1/page_index_status?select=url&retired_at=not.is.null`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return new Set();
    const rows = (await r.json()) as { url: string }[];
    return new Set(rows.map(x => x.url));
  } catch {
    return new Set();
  }
}

// Pages avec noindex quand vides => on les exclut aussi du sitemap pour éviter
// que GSC signale "URL soumise mais marquée 'noindex'".
interface ContentSets {
  citiesWithCategory: Map<string, Set<string>>; // catSlug -> Set<citySlug>
  citiesWithGenre: Map<string, Set<string>>;
  citiesWithVibe: Map<string, Set<string>>;
}

async function fetchContentSets(): Promise<ContentSets | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const nowIso = new Date().toISOString();
    // Pagination REST — max 1000 rows par défaut
    const rows: { city: string; type: string | null; vibe: string | null; genres: string[] | null }[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const r = await fetch(
        `${url}/rest/v1/cached_events?select=city,type,vibe,genres&start_time=gte.${encodeURIComponent(nowIso)}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Range: `${from}-${from + pageSize - 1}`,
            Prefer: 'count=exact',
          },
        },
      );
      if (!r.ok) break;
      const batch = (await r.json()) as typeof rows;
      rows.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
      if (from > 50000) break; // safety
    }

    // Reverse lookup — city label -> slug
    const labelToSlug = new Map<string, string>();
    for (const [slug, label] of Object.entries(CITY_SLUGS)) {
      labelToSlug.set(label.toLowerCase(), slug);
      labelToSlug.set(slugify(label), slug);
    }

    // Reverse lookups — dbValue -> tag slug
    const typeToCategory = new Map<string, string[]>();
    for (const [slug, def] of Object.entries(CATEGORY_SLUGS)) {
      for (const t of def.types) {
        const arr = typeToCategory.get(t.toLowerCase()) || [];
        arr.push(slug);
        typeToCategory.set(t.toLowerCase(), arr);
      }
    }
    const genreToSlugs = new Map<string, string[]>();
    for (const [slug, def] of Object.entries(GENRE_SLUGS)) {
      for (const g of def.dbValues) {
        const arr = genreToSlugs.get(g.toLowerCase()) || [];
        arr.push(slug);
        genreToSlugs.set(g.toLowerCase(), arr);
      }
    }
    const vibeToSlug = new Map<string, string>();
    for (const [slug, def] of Object.entries(VIBE_SLUGS)) {
      vibeToSlug.set(def.dbValue.toLowerCase(), slug);
    }

    const citiesWithCategory = new Map<string, Set<string>>();
    const citiesWithGenre = new Map<string, Set<string>>();
    const citiesWithVibe = new Map<string, Set<string>>();

    const add = (m: Map<string, Set<string>>, k: string, v: string) => {
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(v);
    };

    for (const row of rows) {
      if (!row.city) continue;
      const citySlug = labelToSlug.get(row.city.toLowerCase()) || labelToSlug.get(slugify(row.city));
      if (!citySlug) continue;

      if (row.type) {
        const cats = typeToCategory.get(row.type.toLowerCase()) || [];
        for (const c of cats) add(citiesWithCategory, c, citySlug);
      }
      if (row.vibe) {
        const vs = vibeToSlug.get(row.vibe.toLowerCase());
        if (vs) add(citiesWithVibe, vs, citySlug);
      }
      if (Array.isArray(row.genres)) {
        for (const g of row.genres) {
          const gs = genreToSlugs.get(String(g).toLowerCase()) || [];
          for (const s of gs) add(citiesWithGenre, s, citySlug);
        }
      }
    }

    return { citiesWithCategory, citiesWithGenre, citiesWithVibe };
  } catch {
    return null;
  }
}

// Retire les combos tag×ville vides (page noindex côté runtime) pour éviter
// le warning GSC "URL soumise dans le sitemap mais marquée 'noindex'".
function filterEmptyCombos(routes: SeoRoute[], sets: ContentSets | null): SeoRoute[] {
  if (!sets) return routes;
  return routes.filter(r => {
    let m = r.path.match(/^\/categories\/([^/]+)\/([^/]+)$/);
    if (m) return sets.citiesWithCategory.get(m[1])?.has(m[2]) ?? false;
    m = r.path.match(/^\/genres\/([^/]+)\/([^/]+)$/);
    if (m) return sets.citiesWithGenre.get(m[1])?.has(m[2]) ?? false;
    m = r.path.match(/^\/ambiances\/([^/]+)\/([^/]+)$/);
    if (m) return sets.citiesWithVibe.get(m[1])?.has(m[2]) ?? false;
    return true;
  });
}

function urlset(routes: SeoRoute[]): string {
  const body = routes
    .map(r => `  <url><loc>${esc(SITE + r.path)}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function writeTier(tier: Tier, retired: Set<string>, sets: ContentSets | null): number {
  const raw = getSeoRoutesForTier(tier).filter(r => !retired.has(SITE + r.path));
  const routes = filterEmptyCombos(raw, sets);
  writeFileSync(resolve(`public/sitemap-tier${tier}.xml`), urlset(routes));
  return routes.length;
}

function writeIndex(): void {
  const entries: string[] = [];
  for (const t of [1, 2, 3] as const) {
    entries.push(`  <sitemap><loc>${SITE}/sitemap-tier${t}.xml</loc></sitemap>`);
  }
  entries.push(`  <sitemap><loc>${SITE}/sitemap-events.xml</loc></sitemap>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`;
  writeFileSync(resolve('public/sitemap.xml'), xml);
}

const retired = await fetchRetiredUrls();
const sets = await fetchContentSets();
const counts = {
  t1: writeTier(1, retired, sets),
  t2: writeTier(2, retired, sets),
  t3: writeTier(3, retired, sets),
};
writeIndex();

void existsSync;

const setsInfo = sets
  ? `combos filtrés — categories:${sets.citiesWithCategory.size} genres:${sets.citiesWithGenre.size} vibes:${sets.citiesWithVibe.size}`
  : 'combos non filtrés (pas de DB accessible)';

console.log(
  `sitemap.xml (index) + 3 tier files — tier1: ${counts.t1}, tier2: ${counts.t2}, tier3: ${counts.t3} (total ${counts.t1 + counts.t2 + counts.t3}), retired exclus: ${retired.size} · ${setsInfo}`,
);
