// IndexNow ping (Bing, DuckDuckGo, Ecosia, Yahoo, Qwant...).
// Auth: service role bearer OU header x-refresh-secret (REFRESH_EVENTS_SECRET), comme refresh-events.
// Body: { urls?: string[], dry_run?: boolean }
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { SITE, CITIES_TIER_1, CITIES_TIER_2 } from '../_shared/seo-routes.ts';

const HOST = 'pulse-map.live';
const KEY = '55585cec66274aa0700c0f81bc11d3b3';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH = 5000;
const MAX_PER_CALL = 10000;
const MIN_CITY_EVENTS = 5;
const CITY_RESEND_MS = 24 * 3600_000;
const PURGE_DAYS = 60;

// ---------------------------------------------------------------------------
// COPIE SYNCHRONISEE de src/lib/seo/eventIndexability.ts et de eventSlug
// (src/lib/seo/slug.ts). Toute modification là-bas doit être reportée ici.
// ---------------------------------------------------------------------------
const MAX_DURATION_DAYS = 14;
const MIN_DESCRIPTION = 120;
const GENERIC_TITLE = /^(visite (libre|guid[ée]e)|atelier|exposition permanente|parcours|balade)\b/i;
const OFF_TOPIC = [
  'job dating', 'jobdating', 'recrutement', 'recrute', 'formation', 'interim', 'permanence',
  'don du sang', 'collecte de sang', 'conseil municipal', 'conseil communautaire', 'point retraite',
  'retraite', 'creation d\'entreprise', 'creer son entreprise', 'accompagnement emploi', 'emploi',
  'webinaire', 'webinar', 'forum des metiers', 'france travail', 'pole emploi', 'cv ', 'entretien d\'embauche',
  'reunion publique', 'reunion d\'information', 'atelier numerique', 'vaccination', 'depistage',
];
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’`]/g, "'");
}
function isOffTopic(name: string): boolean {
  const n = ` ${normalize(name)} `;
  return OFF_TOPIC.some((k) => n.includes(k));
}
interface Ev { id: string; name: string; description: string | null; start_time: string; end_time: string | null; city: string | null }
function isEventIndexable(e: Ev, now = new Date()): boolean {
  const start = new Date(e.start_time).getTime();
  const end = e.end_time ? new Date(e.end_time).getTime() : start;
  if (end < now.getTime()) return false;
  if ((end - start) / 86_400_000 > MAX_DURATION_DAYS) return false;
  if ((e.description || '').trim().length < MIN_DESCRIPTION) return false;
  if (GENERIC_TITLE.test(e.name.trim())) return false;
  if (isOffTopic(e.name)) return false;
  return true;
}
function slugify(input: string): string {
  return (input || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'event';
}
const eventSlug = (name: string, id: string) => `${slugify(name)}-${id}`;
// ---------------------------------------------------------------------------

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const secret = Deno.env.get('REFRESH_EVENTS_SECRET') || '';
  const okBearer = (req.headers.get('authorization') || '') === `Bearer ${serviceKey}`;
  const okSecret = secret !== '' && req.headers.get('x-refresh-secret') === secret;
  if (!okBearer && !okSecret) return json(401, { error: 'Unauthorized' });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const dryRun = body?.dry_run === true;
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
    const now = new Date();

    if (!dryRun) {
      await sb.from('indexnow_submitted').delete()
        .lt('submitted_at', new Date(now.getTime() - PURGE_DAYS * 86400_000).toISOString());
    }

    let candidates: string[];
    const cityUrls = new Set<string>();

    if (Array.isArray(body?.urls) && body.urls.length > 0) {
      candidates = body.urls.filter((u: unknown): u is string => typeof u === 'string' && u.startsWith(`https://${HOST}/`));
    } else {
      const nowIso = now.toISOString();
      const rows: Ev[] = [];
      for (let from = 0; from < 60000; from += 1000) {
        const { data, error } = await sb.from('cached_events')
          .select('id,name,description,start_time,end_time,city')
          .or(`start_time.gte.${nowIso},end_time.gte.${nowIso}`)
          .order('id').range(from, from + 999);
        if (error) throw error;
        rows.push(...(data as Ev[]));
        if (!data || data.length < 1000) break;
      }
      candidates = rows.filter((e) => isEventIndexable(e, now)).map((e) => `${SITE}/evenements/${eventSlug(e.name, e.id)}`);

      const counts = new Map<string, number>();
      for (const e of rows) if (e.city) counts.set(slugify(e.city), (counts.get(slugify(e.city)) || 0) + 1);
      for (const c of [...CITIES_TIER_1, ...CITIES_TIER_2]) {
        if ((counts.get(c) || 0) >= MIN_CITY_EVENTS) cityUrls.add(`${SITE}/sortir-ce-soir/${c}`);
      }
      candidates.push(...cityUrls);
    }
    candidates = [...new Set(candidates)];

    // Déjà envoyées : événements jamais renvoyés, villes renvoyées après 24 h.
    const sent = new Map<string, number>();
    for (let i = 0; i < candidates.length; i += 500) {
      const { data, error } = await sb.from('indexnow_submitted').select('url,submitted_at').in('url', candidates.slice(i, i + 500));
      if (error) throw error;
      for (const r of data || []) sent.set(r.url, new Date(r.submitted_at).getTime());
    }
    const toSend = candidates.filter((u) => {
      const t = sent.get(u);
      if (t === undefined) return true;
      return cityUrls.has(u) && now.getTime() - t > CITY_RESEND_MS;
    });
    const skipped = candidates.length - toSend.length;
    const capped = toSend.slice(0, MAX_PER_CALL);

    if (dryRun) {
      return json(200, {
        dry_run: true, found: candidates.length, to_submit: capped.length, remaining_after_cap: toSend.length - capped.length,
        skipped_already_sent: skipped, city_pages: cityUrls.size, examples: capped.slice(0, 5),
      });
    }

    let submitted = 0, batches = 0;
    const statusCodes: number[] = [];
    for (let i = 0; i < capped.length; i += BATCH) {
      const urlList = capped.slice(i, i + BATCH);
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
      });
      batches++;
      statusCodes.push(res.status);
      const text = await res.text().catch(() => '');
      if (res.status === 200 || res.status === 202) {
        const ts = new Date().toISOString();
        for (let j = 0; j < urlList.length; j += 1000) {
          const { error } = await sb.from('indexnow_submitted')
            .upsert(urlList.slice(j, j + 1000).map((url) => ({ url, submitted_at: ts })), { onConflict: 'url' });
          if (error) console.error('[indexnow-ping] upsert failed:', error.message);
        }
        submitted += urlList.length;
        continue;
      }
      console.error(`[indexnow-ping] IndexNow ${res.status}: ${text.slice(0, 500)}`);
      break; // 429, 403, 422 ou autre : on arrête, rien n'est marqué pour ce lot
    }

    console.log(`[indexnow-ping] found=${candidates.length} submitted=${submitted} skipped=${skipped} codes=${statusCodes.join(',')}`);
    return json(200, { found: candidates.length, submitted, skipped_already_sent: skipped, batches, status_codes: statusCodes });
  } catch (e) {
    console.error('[indexnow-ping] error:', e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
