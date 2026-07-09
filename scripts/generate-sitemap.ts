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

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

// Fetch URLs marked as retired so we can exclude them from every tier sitemap.
// Falls back to an empty set if the DB call fails (dev without secrets, offline
// build). The runtime <meta robots="noindex"> + client redirect still applies.
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

function urlset(routes: SeoRoute[]): string {
  const body = routes
    .map(r => `  <url><loc>${esc(SITE + r.path)}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function writeTier(tier: Tier, retired: Set<string>): number {
  const routes = getSeoRoutesForTier(tier).filter(r => !retired.has(SITE + r.path));
  writeFileSync(resolve(`public/sitemap-tier${tier}.xml`), urlset(routes));
  return routes.length;
}

function writeIndex(): void {
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];
  for (const t of [1, 2, 3] as const) {
    entries.push(`  <sitemap><loc>${SITE}/sitemap-tier${t}.xml</loc><lastmod>${today}</lastmod></sitemap>`);
  }
  entries.push(`  <sitemap><loc>${SITE}/sitemap-events.xml</loc><lastmod>${today}</lastmod></sitemap>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`;
  writeFileSync(resolve('public/sitemap.xml'), xml);
}

const retired = await fetchRetiredUrls();
const counts = { t1: writeTier(1, retired), t2: writeTier(2, retired), t3: writeTier(3, retired) };
writeIndex();

void existsSync;

console.log(
  `sitemap.xml (index) + 3 tier files written — tier1: ${counts.t1}, tier2: ${counts.t2}, tier3: ${counts.t3} routes (total ${counts.t1 + counts.t2 + counts.t3}), retired excluded: ${retired.size}`,
);
