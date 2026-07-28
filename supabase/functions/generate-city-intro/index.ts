// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const REFRESH_SECRET = Deno.env.get('REFRESH_EVENTS_SECRET') ?? '';

const MODEL = 'google/gemini-3.6-flash';

// Full French city list (must match src/lib/seo/slug.ts CITY_SLUGS).
// Kept short here — the caller can pass a specific slug OR "all" to loop over
// whatever exists in the request payload.
const DEFAULT_TIER1 = [
  ['paris','Paris'],['lyon','Lyon'],['marseille','Marseille'],['toulouse','Toulouse'],
  ['nice','Nice'],['nantes','Nantes'],['bordeaux','Bordeaux'],['grenoble','Grenoble'],
  ['lille','Lille'],['strasbourg','Strasbourg'],['montpellier','Montpellier'],
  ['rennes','Rennes'],['reims','Reims'],['toulon','Toulon'],['angers','Angers'],
];

interface Snapshot {
  count: number;
  topGenres: string[];
  topVenues: string[];
  topTypes: string[];
  nextEvents: { name: string; venue: string; start_time: string }[];
}

async function buildSnapshot(admin: any, cityName: string): Promise<Snapshot> {
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from('cached_events')
    .select('name,venue,type,genres,start_time')
    .ilike('city', cityName)
    .gte('start_time', nowIso)
    .order('start_time', { ascending: true })
    .limit(200);

  const rows = (data ?? []) as any[];
  const genreCount = new Map<string, number>();
  const venueCount = new Map<string, number>();
  const typeCount = new Map<string, number>();
  for (const r of rows) {
    (r.genres ?? []).forEach((g: string) => genreCount.set(g, (genreCount.get(g) ?? 0) + 1));
    if (r.venue) venueCount.set(r.venue, (venueCount.get(r.venue) ?? 0) + 1);
    if (r.type) typeCount.set(r.type, (typeCount.get(r.type) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  return {
    count: rows.length,
    topGenres: top(genreCount, 4),
    topVenues: top(venueCount, 4),
    topTypes: top(typeCount, 3),
    nextEvents: rows.slice(0, 3).map(r => ({ name: r.name, venue: r.venue, start_time: r.start_time })),
  };
}

async function callGemini(prompt: string): Promise<any> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': LOVABLE_API_KEY,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            "Tu es rédacteur SEO pour PulseMap, une carte live des soirées et sorties en France. Ton style : direct, jeune, sans clichés touristiques, sans emoji. Tu écris toujours en français. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.",
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body}`);
  }
  const json = await res.json();
  const text: string = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(text);
}

function promptFor(cityName: string, snap: Snapshot): string {
  const events = snap.nextEvents.map(e =>
    `- ${e.name} @ ${e.venue} (${new Date(e.start_time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})`
  ).join('\n') || '(aucun event indexé ce soir)';

  return `Rédige un contenu SEO unique pour la page "Soirée ${cityName}" de PulseMap.

Données live sur ${cityName} :
- ${snap.count} événements à venir référencés
- Genres dominants : ${snap.topGenres.join(', ') || 'variés'}
- Lieux récurrents : ${snap.topVenues.join(', ') || 'divers'}
- Prochains events :
${events}

Contraintes :
1. h1 : max 65 caractères, doit contenir "Soirée ${cityName}" ou "Sortir ce soir à ${cityName}", accrocheur.
2. meta_description : 140-160 caractères, mentionne ${cityName}, contient un CTA implicite, pas de guillemets.
3. intro_html : 250-320 mots, HTML simple (uniquement <p>, <strong>, <em>, <ul>, <li>). Style PulseMap : direct, concret, mentionne 1-2 quartiers connus de ${cityName}, référence les genres/lieux réels ci-dessus, évite le blabla générique ("ville dynamique", "riche en culture"). Termine par une phrase qui incite à ouvrir la carte.

Réponds en JSON strict :
{"h1": "...", "meta_description": "...", "intro_html": "<p>...</p><p>...</p>"}`;
}

async function generateOne(admin: any, citySlug: string, cityName: string) {
  const snap = await buildSnapshot(admin, cityName);
  const out = await callGemini(promptFor(cityName, snap));

  const h1 = String(out.h1 ?? '').slice(0, 120);
  const meta = String(out.meta_description ?? '').slice(0, 200);
  const intro = String(out.intro_html ?? '');
  if (!h1 || !meta || !intro) throw new Error('Empty AI output');

  const { error } = await admin.from('city_seo_intros').upsert({
    city_slug: citySlug,
    city_name: cityName,
    h1,
    intro_html: intro,
    meta_description: meta,
    model: MODEL,
    events_snapshot: snap as any,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'city_slug' });
  if (error) throw error;

  return { citySlug, cityName, events: snap.count };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authz = req.headers.get('authorization') ?? '';
    const bearer = authz.replace(/^Bearer\s+/i, '');

    // Accept: (1) refresh secret, (2) service role key, or (3) an authenticated
    // user whose account has the `admin` app_role (invoked from /admin panel).
    let allowed = REFRESH_SECRET && (bearer === REFRESH_SECRET || bearer === SERVICE_ROLE);
    if (!allowed && bearer) {
      const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        const svc = createClient(SUPABASE_URL, SERVICE_ROLE);
        const { data: roleRow } = await svc
          .from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle();
        if (roleRow) allowed = true;
      }
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Single city
    if (body.citySlug && body.cityName) {
      const result = await generateOne(admin, String(body.citySlug), String(body.cityName));
      return new Response(JSON.stringify({ ok: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Batch mode
    const list: [string, string][] = Array.isArray(body.cities) && body.cities.length
      ? body.cities.map((c: any) => [String(c.slug), String(c.name)])
      : DEFAULT_TIER1;

    const delayMs = Number(body.delayMs ?? 1500);
    const results: any[] = [];
    for (const [slug, name] of list) {
      try {
        results.push(await generateOne(admin, slug, name));
      } catch (e) {
        results.push({ citySlug: slug, error: (e as Error).message });
      }
      await new Promise(r => setTimeout(r, delayMs));
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-city-intro error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
