// Dynamic sitemap of all static SEO pages (cities, categories, legal).
// Single source of truth: editing the arrays below auto-updates the sitemap.
// Keep CITIES / CATEGORIES in sync with src/lib/seo/slug.ts.

const SITE = 'https://pulse-map.live';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CITIES = [
  'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'bordeaux',
  'grenoble', 'lille', 'strasbourg', 'rennes', 'montpellier',
  'aix-en-provence', 'saint-etienne', 'villeurbanne',
];

const CATEGORIES = [
  'concerts', 'soirees', 'festivals', 'bars', 'sport', 'culture', 'brocantes',
];

const LEGAL = ['privacy-policy', 'terms', 'contact-legal'];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

function urlEntry(path: string, changefreq: string, priority: string): string {
  return `  <url><loc>${escapeXml(`${SITE}${path}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const urls: string[] = [];

  // Homepage + cities index
  urls.push(urlEntry('/', 'hourly', '1.0'));
  urls.push(urlEntry('/villes', 'daily', '0.8'));

  // City landing pages (/villes/:slug)
  for (const c of CITIES) urls.push(urlEntry(`/villes/${c}`, 'daily', '0.9'));

  // High-intent "sortir ce soir" pages (canonical for the target query)
  for (const c of CITIES) urls.push(urlEntry(`/sortir-ce-soir/${c}`, 'hourly', '0.95'));

  // Category pages
  for (const cat of CATEGORIES) urls.push(urlEntry(`/categories/${cat}`, 'daily', '0.7'));

  // Legal pages
  for (const l of LEGAL) urls.push(urlEntry(`/${l}`, 'monthly', '0.3'));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
});
