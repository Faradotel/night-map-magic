// InfoConcert festival scraper — per-city.
// URL pattern: https://www.infoconcert.com/festival/ville/<slug>
// InfoConcert is Cloudflare-protected → we go through Firecrawl.

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

// Same slugs as fetch-infoconcert (concerts) — reused for /festival/ville/<slug>
const CITY_SLUGS: Record<string, string> = {
  'Paris': 'paris-5133', 'Marseille': 'marseille-5132', 'Lyon': 'lyon-5131',
  'Toulouse': 'toulouse-2991', 'Nice': 'nice-2336', 'Nantes': 'nantes-2306',
  'Montpellier': 'montpellier-2271', 'Strasbourg': 'strasbourg-2950',
  'Bordeaux': 'bordeaux-1098', 'Lille': 'lille-2078', 'Rennes': 'rennes-2569',
  'Reims': 'reims-2567', 'Grenoble': 'grenoble-1842', 'Dijon': 'dijon-1721',
  'Tours': 'tours-2998', 'Rouen': 'rouen-2610', 'Metz': 'metz-1907',
  'Nancy': 'nancy-1914', 'Avignon': 'avignon-427', 'Poitiers': 'poitiers-1962',
  'Besançon': 'besancon-1786', 'Caen': 'caen-1284', 'Orléans': 'orleans-1934',
  'Angers': 'angers-200', 'Brest': 'brest-1796', 'Limoges': 'limoges-1886',
  'Amiens': 'amiens-1765', 'Perpignan': 'perpignan-1952',
  'La Rochelle': 'la-rochelle-1871', 'Pau': 'pau-1944',
  'Clermont-Ferrand': 'clermont-ferrand-3180', 'Monaco': 'monaco-1909',
  'Aix-en-Provence': 'aix-en-provence-48', 'Toulon': 'toulon-2990',
  'Saint-Étienne': 'saint-etienne-2676', 'Nîmes': 'nimes-2340',
  'Valence': 'valence-2098', 'Mulhouse': 'mulhouse-1912',
  'Dunkerque': 'dunkerque-1831', 'Le Mans': 'le-mans-2007',
  'Le Havre': 'le-havre-1875',
};

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

const PLACEHOLDER_RE = /^(unknown|n\/?a|non\s*sp[ée]cifi[ée]|à\s*confirmer|tba|tbd|tbc|none|null|undefined|inconnu|—|-+|\?+)$/i;
function isPlaceholder(v: unknown): boolean {
  if (typeof v !== 'string') return true;
  const s = v.trim();
  return !s || PLACEHOLDER_RE.test(s);
}
function cleanField(v: unknown): string {
  return isPlaceholder(v) ? '' : (v as string).trim();
}
function normalize(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
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
          startDate: { type: 'string', description: 'Start date ISO YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date ISO YYYY-MM-DD or empty' },
          venue: { type: 'string', description: 'Venue name if printed, else empty' },
          city: { type: 'string', description: 'City where it takes place (must match the page context)' },
          genre: { type: 'string', description: 'Music genre if printed, else empty' },
          url: { type: 'string', description: 'Absolute URL to festival page on infoconcert.com' },
        },
        required: ['name'],
      },
    },
  },
  required: ['festivals'],
};

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
    return new Response(JSON.stringify({ success: true, events: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { city } = await req.json();
    if (!city) {
      return new Response(JSON.stringify({ success: false, error: 'Missing city' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const slug = CITY_SLUGS[city];
    if (!slug) {
      return new Response(JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const pageUrl = `https://www.infoconcert.com/festival/ville/${slug}`;

    console.log(`[ICF] ${city} → ${pageUrl}`);

    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageUrl,
        formats: ['extract'],
        onlyMainContent: true,
        extract: {
          schema: festivalSchema,
          prompt: `Extract EVERY festival card listed on this page for ${city}. Today is ${new Date().toISOString().slice(0, 10)}. Use ONLY info literally printed. Skip past festivals. If a field is missing, return empty string. Include the full absolute URL to each festival's dedicated page.`,
        },
        waitFor: 3500,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });

    if (!res.ok) {
      console.log(`[ICF] ${city} scrape failed: ${res.status}`);
      return new Response(JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    const extracted = data?.data?.extract || data?.extract || null;
    const rawFestivals: any[] = Array.isArray(extracted?.festivals) ? extracted.festivals : [];
    console.log(`[ICF] ${city} extracted ${rawFestivals.length} festivals`);

    // Dedup within page
    const seen = new Set<string>();
    const deduped = rawFestivals.filter(f => {
      const key = `${(f.name || '').toLowerCase().trim()}|${(f.startDate || '').slice(0, 10)}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const events: any[] = [];
    for (const f of deduped) {
      const name = cleanField(f.name);
      if (!name || name.length < 3) continue;

      const startTime = fixEventDate(f.startDate || '');
      if (!startTime) continue;
      const endTime = fixEventDate(f.endDate || '') || null;

      const venue = cleanField(f.venue);
      let coords: { lat: number; lng: number } | null = null;
      if (venue) coords = await geocode(`${venue}, ${city}, France`);
      if (!coords) coords = await geocode(`${name}, ${city}, France`);
      if (!coords) coords = cityCoords;

      const genre = cleanField(f.genre);
      const url = cleanField(f.url);
      const id = `icf-${normalize(city)}-${normalize(name).slice(0, 24)}-${startTime.slice(0, 10)}`;

      events.push({
        id,
        name,
        venue: venue || city,
        address: venue ? `${venue}, ${city}` : city,
        city,
        lat: coords.lat,
        lng: coords.lng,
        startTime,
        endTime,
        description: (genre ? `[${genre}] ` : '') + '• via InfoConcert',
        ticketUrl: url && url.startsWith('http') ? url : pageUrl,
        price: null,
        genres: genre ? [genre.toLowerCase()] : [],
        externalAttendees: null,
      });
    }

    console.log(`[ICF] ${city} returning ${events.length} festivals`);
    return new Response(JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[ICF] Error:', err);
    return new Response(JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
