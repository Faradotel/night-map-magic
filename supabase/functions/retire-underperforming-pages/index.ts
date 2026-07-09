// Retire (410-like) les pages non indexées depuis 42+ jours.
// Cron hebdomadaire (dimanche 4h). Épargne toujours les villes Tier 1.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { CITIES_TIER_1 } from '../_shared/seo-routes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETIRE_AFTER_DAYS = 42;
const BAD_STATES = [
  'Discovered - currently not indexed',
  'Crawled - currently not indexed',
  'URL is unknown to Google',
  'Page with redirect',
  'Duplicate without user-selected canonical',
  'Duplicate, Google chose different canonical than user',
  'Alternate page with proper canonical tag',
  'Excluded by \u2018noindex\u2019 tag',
];

function isTier1Protected(url: string): boolean {
  // On protège la page racine ville et /sortir-ce-soir/<tier1> et /categories/soirees/<tier1>
  // parce que ce sont les pages "phares" — on ne les retire jamais.
  for (const c of CITIES_TIER_1) {
    if (url.endsWith(`/sortir-ce-soir/${c}`)) return true;
    if (url.endsWith(`/villes/${c}`)) return true;
    if (url.endsWith(`/categories/soirees/${c}`)) return true;
  }
  // Pages statiques top-level
  const p = new URL(url).pathname;
  if (['/', '/villes'].includes(p)) return true;
  if (p.split('/').filter(Boolean).length <= 2 && p.startsWith('/categories/')) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);

  const threshold = new Date(Date.now() - RETIRE_AFTER_DAYS * 86400_000).toISOString();

  const { data: candidates, error } = await supabase
    .from('page_index_status')
    .select('id, url, coverage_state')
    .is('retired_at', null)
    .eq('is_indexed', false)
    .lt('first_tracked_at', threshold)
    .in('coverage_state', BAD_STATES);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const toRetire = (candidates || []).filter(r => !isTier1Protected(r.url));
  const protectedCount = (candidates || []).length - toRetire.length;

  if (toRetire.length > 0) {
    const now = new Date().toISOString();
    // Update en batch — pas de bulk update par IDs différents en supabase-js, on itère
    for (const row of toRetire) {
      await supabase.from('page_index_status').update({
        retired_at: now,
        retire_reason: row.coverage_state,
      }).eq('id', row.id);
    }
  }

  return new Response(JSON.stringify({
    candidates: candidates?.length || 0,
    retired: toRetire.length,
    protected_tier1: protectedCount,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
