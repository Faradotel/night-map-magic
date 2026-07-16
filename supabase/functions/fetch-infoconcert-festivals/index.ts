// InfoConcert festival scraper — bulk mode.
// InfoConcert is Cloudflare-protected, so we go through Firecrawl.
// Called ONCE per refresh cycle (no city param) — scrapes the /festival/
// index across several pages, extracts festivals with LLM, geocodes them,
// and returns events grouped by city.

const ALLOWED_ORIGINS = [
  'https://pulse-map.live',
  'https://www.pulse-map.live',
  'https://pulsemap-official.lovable.app',
  'https://id-preview--558c7333-dd3f-4317-a4d6-54b2b3b30b02.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Paris': { lat: 48.8566, lng: 2.3522 }, 'Marseille': { lat: 43.2965, lng: 5.3698 },
  'Lyon': { lat: 45.7640, lng: 4.8357 }, 'Toulouse': { lat: 43.6047, lng: 1.4442 },
  'Nice': { lat: 43.7102, lng: 7.2620 }, 'Nantes': { lat: 47.2184, lng: -1.5536 },
  'Montpellier': { lat: 43.6108, lng: 3.8767 }, 'Strasbourg': { lat: 48.5734, lng: 7.7521 },
  'Bordeaux': { lat: 44.8378, lng: -0.5792 }, 'Lille': { lat: 50.6292, lng: 3.0573 },
  'Rennes': { lat: 48.1173, lng: -1.6778 }, 'Grenoble': { lat: 45.1885, lng: 5.7245 },
  'Dijon': { lat: 47.3220, lng: 5.0415 }, 'Monaco': { lat: 43.7384, lng: 7.4246 },
  'Reims': { lat: 49.2583, lng: 4.0317 }, 'Tours': { lat: 47.3941, lng: 0.6848 },
  'Rouen': { lat: 49.4432, lng: 1.0999 }, 'Metz': { lat: 49.1193, lng: 6.1757 },
  'Nancy': { lat: 48.6921, lng: 6.1844 }, 'Avignon': { lat: 43.9493, lng: 4.8055 },
  'Poitiers': { lat: 46.5802, lng: 0.3404 }, 'Besançon': { lat: 47.2378, lng: 6.0241 },
  'Caen': { lat: 49.1829, lng: -0.3707 }, 'Orléans': { lat: 47.9029, lng: 1.9093 },
  'Angers': { lat: 47.4784, lng: -0.5632 }, 'Brest': { lat: 48.3904, lng: -4.4861 },
  'Limoges': { lat: 45.8336, lng: 1.2611 }, 'Amiens': { lat: 49.8941, lng: 2.2958 },
  'Perpignan': { lat: 42.6887, lng: 2.8948 }, 'La Rochelle': { lat: 46.1603, lng: -1.1511 },
  'Pau': { lat: 43.2951, lng: -0.3708 }, 'Clermont-Ferrand': { lat: 45.7772, lng: 3.0870 },
  'Aix-en-Provence': { lat: 43.5297, lng: 5.4474 }, 'Toulon': { lat: 43.1242, lng: 5.9280 },
  'Saint-Étienne': { lat: 45.4397, lng: 4.3872 }, 'Nîmes': { lat: 43.8367, lng: 4.3601 },
  'Dunkerque': { lat: 51.0343, lng: 2.3768 }, 'Mulhouse': { lat: 47.7508, lng: 7.3359 },
  'Valence': { lat: 44.9334, lng: 4.8924 }, 'Le Havre': { lat: 49.4944, lng: 0.1079 },
  'Le Mans': { lat: 48.0061, lng: 0.1996 },
};

const KNOWN_CITIES = Object.keys(CITY_COORDS);

function normalizeCity(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '').trim();
}

// Map any city string returned by the LLM to one of our known cities
function matchKnownCity(rawCity: string): string | null {
  const n = normalizeCity(rawCity);
  if (!n) return null;
  for (const c of KNOWN_CITIES) {
    if (normalizeCity(c) === n) return c;
  }
  // partial contains (e.g. "Paris 12", "Nice Cedex")
  for (const c of KNOWN_CITIES) {
    const cn = normalizeCity(c);
    if (n.startsWith(cn) || n.includes(cn)) return c;
  }
  return null;
}

const PLACEHOLDER_RE = /^(unknown|n\/?a|non\s*sp[ée]cifi[ée]|à\s*confirmer|tba|tbd|tbc|none|null|undefined|inconnu|—|-+|\?+)$/i;
function isPlaceholder(v: unknown): boolean {
  if (typeof v !== 'string') return true;
  const s = v.trim();
  return !s || PLACEHOLDER_RE.test(s);
}
function cleanField(v: unknown): string {
  return isPlaceholder(v) ? '' : (v as string).trim();
}

function fixEventDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return '';
    const now = new Date();
    if (parsed.getFullYear() < now.getFullYear()) {
      const fixed = new Date(parsed);
      fixed.setFullYear(now.getFullYear());
      if (fixed.getTime() < now.getTime() - 86400000) fixed.setFullYear(now.getFullYear() + 1);
      return fixed.toISOString();
    }
    if (parsed.getTime() < now.getTime() - 86400000) return '';
    return parsed.toISOString();
  } catch { return ''; }
}

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=1`,
      { headers: { 'User-Agent': 'PulseMap/1.0 (pulse-map.live)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

const festivalSchema = {
  type: 'object',
  properties: {
    festivals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Official festival name' },
          startDate: { type: 'string', description: 'Start date ISO YYYY-MM-DD (assume current or next year if not stated)' },
          endDate: { type: 'string', description: 'End date ISO YYYY-MM-DD or empty' },
          city: { type: 'string', description: 'French city literally printed on the card — leave empty if absent' },
          venue: { type: 'string', description: 'Venue name if printed, else empty' },
          genre: { type: 'string', description: 'Music genre if printed, else empty' },
          url: { type: 'string', description: 'Absolute URL to festival page on infoconcert.com' },
        },
        required: ['name'],
      },
    },
  },
  required: ['festivals'],
};

async function scrapeIndexPage(pageUrl: string, apiKey: string): Promise<any[]> {
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageUrl,
        formats: ['extract'],
        onlyMainContent: true,
        extract: {
          schema: festivalSchema,
          prompt: `Extract EVERY festival card on this page. Today is ${new Date().toISOString().slice(0, 10)}. Use ONLY info literally printed. If a field is missing, return empty string. Include the full URL to each festival's dedicated page. Only list festivals that take place in FRANCE (or Monaco).`,
        },
        waitFor: 3500,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });
    if (!res.ok) {
      console.log(`[ICF] scrape ${pageUrl} failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const extracted = data?.data?.extract || data?.extract || null;
    return Array.isArray(extracted?.festivals) ? extracted.festivals : [];
  } catch (e) {
    console.log(`[ICF] scrape ${pageUrl} error:`, e);
    return [];
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const _serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const _auth = req.headers.get('authorization') || '';
  if (_auth !== `Bearer ${_serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ success: true, byCity: {} }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // Scrape multiple pages of the /festival/ index. Firecrawl bypasses CF.
    const pages = [
      'https://www.infoconcert.com/festival/',
      'https://www.infoconcert.com/festival/?page=2',
      'https://www.infoconcert.com/festival/?page=3',
      'https://www.infoconcert.com/festival/?page=4',
      'https://www.infoconcert.com/festival/?page=5',
      'https://www.infoconcert.com/festival/?page=6',
    ];

    console.log(`[ICF] Scraping ${pages.length} festival index pages via Firecrawl...`);
    const results = await Promise.allSettled(pages.map(p => scrapeIndexPage(p, firecrawlKey)));
    const allFestivals: any[] = [];
    for (const r of results) if (r.status === 'fulfilled') allFestivals.push(...r.value);

    console.log(`[ICF] Raw extracted: ${allFestivals.length}`);

    // Dedup by name+startDate
    const seen = new Set<string>();
    const deduped = allFestivals.filter(f => {
      const key = `${(f.name || '').toLowerCase().trim()}|${(f.startDate || '').slice(0, 10)}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const byCity: Record<string, any[]> = {};

    // Sequential geocoding to respect Nominatim rate limits (~1 req/s)
    for (let i = 0; i < deduped.length; i++) {
      const f = deduped[i];
      const name = cleanField(f.name);
      if (!name || name.length < 3) continue;

      const rawCity = cleanField(f.city);
      const knownCity = matchKnownCity(rawCity);
      if (!knownCity) continue; // outside our supported cities

      const startTime = fixEventDate(f.startDate || '');
      if (!startTime) continue;
      const endTime = fixEventDate(f.endDate || '') || null;

      const venue = cleanField(f.venue);
      const cityCoords = CITY_COORDS[knownCity];

      // Try venue geocoding, fall back to festival name in city, else city center
      let coords: { lat: number; lng: number } | null = null;
      if (venue) coords = await geocode(`${venue}, ${knownCity}, France`);
      if (!coords) coords = await geocode(`${name}, ${knownCity}, France`);
      if (!coords) coords = cityCoords;

      const genre = cleanField(f.genre);
      const url = cleanField(f.url);
      const id = `icf-${normalizeCity(knownCity)}-${normalizeCity(name).slice(0, 24)}-${startTime.slice(0, 10)}`;

      const event = {
        id,
        name,
        venue: venue || knownCity,
        address: venue ? `${venue}, ${knownCity}` : knownCity,
        city: knownCity,
        lat: coords.lat,
        lng: coords.lng,
        startTime,
        endTime,
        description: (genre ? `[${genre}] ` : '') + '• via InfoConcert',
        ticketUrl: url && url.startsWith('http') ? url : 'https://www.infoconcert.com/festival/',
        price: null,
        genres: genre ? [genre.toLowerCase()] : [],
        externalAttendees: null,
      };

      (byCity[knownCity] ??= []).push(event);
    }

    const total = Object.values(byCity).reduce((s, arr) => s + arr.length, 0);
    console.log(`[ICF] Returning ${total} festivals across ${Object.keys(byCity).length} cities`);

    return new Response(JSON.stringify({ success: true, byCity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[ICF] Error:', err);
    return new Response(JSON.stringify({ success: true, byCity: {} }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
