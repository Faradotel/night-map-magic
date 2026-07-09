// Vérifie quotidiennement le statut d'indexation Google d'un batch d'URLs SEO
// via l'API Search Console URL Inspection (au travers du connecteur Lovable).
//
// - Bootstrap : insère toutes les URLs manquantes depuis _shared/seo-routes
// - Prend les 500 URLs les moins récemment vérifiées (LRU)
// - Appelle POST /v1/urlInspection/index:inspect via le gateway connecteur
// - Upsert coverage_state, is_indexed, last_crawl_time, verdict...
//
// Quota GSC : 2000 req/jour/propriété. On en consomme 500 → tour complet des
// ~3272 URLs tous les ~7 jours.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAllSeoUrls, SITE } from '../_shared/seo-routes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://pulse-map.live/';
const BATCH = 500;
const RATE_MS = 1100; // ~55 req/min

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const gscKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!lovableKey || !gscKey) {
    return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY or GOOGLE_SEARCH_CONSOLE_API_KEY' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);

  // ---- Bootstrap : sync la table avec les routes SEO ----
  const allUrls = getAllSeoUrls();
  const { data: existing } = await supabase
    .from('page_index_status')
    .select('url')
    .in('url', allUrls);
  const existingSet = new Set((existing || []).map(r => r.url));
  const missing = allUrls.filter(u => !existingSet.has(u));
  if (missing.length > 0) {
    // Insertion en chunks de 500
    for (let i = 0; i < missing.length; i += 500) {
      const chunk = missing.slice(i, i + 500).map(url => {
        const p = url.replace(SITE, '');
        let tier = 3;
        if (p === '/' || p.startsWith('/villes') || p.startsWith('/categories/') && !p.split('/')[3]) tier = 1;
        return { url, tier };
      });
      await supabase.from('page_index_status').insert(chunk).select();
    }
  }

  // ---- Récupération LRU ----
  const { data: batch, error: batchErr } = await supabase
    .from('page_index_status')
    .select('id, url')
    .is('retired_at', null)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(BATCH);

  if (batchErr) {
    return new Response(JSON.stringify({ error: batchErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results = { checked: 0, indexed: 0, notIndexed: 0, errors: 0, bootstrapped: missing.length };

  for (const row of batch || []) {
    try {
      const r = await fetch(
        'https://connector-gateway.lovable.dev/google_search_console/v1/urlInspection/index:inspect',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'X-Connection-Api-Key': gscKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inspectionUrl: row.url, siteUrl: SITE_URL }),
        },
      );

      if (!r.ok) {
        const body = await r.text();
        console.error(`GSC ${r.status} for ${row.url}: ${body.slice(0, 200)}`);
        await supabase.from('page_index_status').update({
          last_checked_at: new Date().toISOString(),
          check_error: `${r.status}: ${body.slice(0, 200)}`,
        }).eq('id', row.id);
        results.errors++;
      } else {
        const j = await r.json();
        const idx = j.inspectionResult?.indexStatusResult || {};
        const isIndexed = idx.verdict === 'PASS' && idx.coverageState?.toLowerCase().includes('indexed') && !idx.coverageState?.toLowerCase().includes('not indexed');
        await supabase.from('page_index_status').update({
          last_checked_at: new Date().toISOString(),
          coverage_state: idx.coverageState || null,
          verdict: idx.verdict || null,
          is_indexed: !!isIndexed,
          last_crawl_time: idx.lastCrawlTime || null,
          google_canonical: idx.googleCanonical || null,
          user_canonical: idx.userCanonical || null,
          check_error: null,
        }).eq('id', row.id);
        results.checked++;
        if (isIndexed) results.indexed++; else results.notIndexed++;
      }
    } catch (e) {
      console.error(`Exception on ${row.url}:`, e);
      results.errors++;
    }

    await new Promise(r => setTimeout(r, RATE_MS));
  }

  return new Response(JSON.stringify(results), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
