// Admin webhook — relance à la demande la "régénération" des sitemaps.
//
// Les fichiers public/sitemap-tier*.xml sont figés au build (prebuild), mais
// l'edge function `sitemap-pages` sert exactement la même liste en dynamique
// depuis _shared/seo-routes.ts. Donc "régénérer" = re-notifier les moteurs de
// recherche que la liste (et les events) ont changé.
//
// Auth :
//   - Header  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>   (webhook/cron/curl)
//   - OU      Authorization: Bearer <user JWT>  avec has_role(admin) = true
//
// Usage :
//   curl -X POST https://<project>.functions.supabase.co/admin-refresh-sitemaps \
//        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
//
// Optionnel : { "urls": ["https://pulse-map.live/..."] } pour ne pinger qu'un sous-ensemble.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { SITE, getAllSeoUrls } from '../_shared/seo-routes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITEMAP_URLS = [
  `${SITE}/sitemap.xml`,
  `${SITE}/sitemap-tier1.xml`,
  `${SITE}/sitemap-tier2.xml`,
  `${SITE}/sitemap-tier3.xml`,
  `${SITE}/sitemap-events.xml`,
];

const HOST = 'pulse-map.live';
const INDEXNOW_KEY = '55585cec66274aa0700c0f81bc11d3b3';
const INDEXNOW_KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function isAuthorized(req: Request): Promise<{ ok: boolean; reason?: string }> {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return { ok: false, reason: 'missing bearer' };
  const token = auth.slice('Bearer '.length).trim();

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (serviceKey && token === serviceKey) return { ok: true };

  // Fallback : JWT utilisateur + has_role(admin)
  const url = Deno.env.get('SUPABASE_URL') || '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!url || !anon) return { ok: false, reason: 'server misconfigured' };

  const sb = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: claimsErr } = await sb.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) return { ok: false, reason: 'invalid token' };

  const { data: isAdmin, error: roleErr } = await sb.rpc('has_role', {
    _user_id: claims.claims.sub,
    _role: 'admin',
  });
  if (roleErr || isAdmin !== true) return { ok: false, reason: 'not admin' };
  return { ok: true };
}

async function pingIndexNow(urls: string[]): Promise<Record<string, unknown>> {
  const filtered = urls.filter(u => u.startsWith(`https://${HOST}/`)).slice(0, 10000);
  if (filtered.length === 0) return { skipped: true, reason: 'no urls' };

  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: filtered,
    }),
  });
  return { ok: res.ok, status: res.status, submitted: filtered.length };
}

async function pingSitemapEndpoint(engine: 'google' | 'bing', sitemapUrl: string) {
  const base = engine === 'google'
    ? 'https://www.google.com/ping?sitemap='
    : 'https://www.bing.com/ping?sitemap=';
  try {
    const res = await fetch(base + encodeURIComponent(sitemapUrl), { method: 'GET' });
    return { engine, sitemap: sitemapUrl, ok: res.ok, status: res.status };
  } catch (e) {
    return { engine, sitemap: sitemapUrl, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function warmDynamicSitemap() {
  // Force le edge cache CDN à revalider en frappant sitemap-pages avec no-cache.
  const url = Deno.env.get('SUPABASE_URL') || '';
  if (!url) return { skipped: true };
  const target = `${url}/functions/v1/sitemap-pages`;
  try {
    const res = await fetch(target, { headers: { 'Cache-Control': 'no-cache' } });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST' && req.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const auth = await isAuthorized(req);
  if (!auth.ok) return json(401, { error: 'Unauthorized', reason: auth.reason });

  let customUrls: string[] | null = null;
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.urls) && body.urls.length > 0) {
      customUrls = body.urls.filter((u: unknown): u is string => typeof u === 'string');
    }
  }

  const targetUrls = customUrls ?? getAllSeoUrls();
  console.log(`[admin-refresh-sitemaps] pinging ${targetUrls.length} URLs`);

  const [indexnow, warm, ...pings] = await Promise.all([
    pingIndexNow(targetUrls),
    warmDynamicSitemap(),
    ...SITEMAP_URLS.flatMap(u => [pingSitemapEndpoint('google', u), pingSitemapEndpoint('bing', u)]),
  ]);

  return json(200, {
    ok: true,
    refreshed_at: new Date().toISOString(),
    urls_submitted: targetUrls.length,
    indexnow,
    dynamic_sitemap_warm: warm,
    search_engine_pings: pings,
    note: 'Les fichiers public/sitemap-tier*.xml se régénèrent au prochain build (prebuild). L\'edge function sitemap-pages sert déjà la liste à jour en dynamique.',
  });
});
