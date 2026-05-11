// Scrape InfoConcert listings for a city using Firecrawl

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

// InfoConcert uses slug-ID format: https://www.infoconcert.com/ville/grenoble-1842
const CITY_SLUGS: Record<string, string> = {
  'Paris': 'paris-1938', 'Marseille': 'marseille-1900', 'Lyon': 'lyon-1893',
  'Toulouse': 'toulouse-2086', 'Nice': 'nice-1921', 'Nantes': 'nantes-1915',
  'Montpellier': 'montpellier-1911', 'Strasbourg': 'strasbourg-2071',
  'Bordeaux': 'bordeaux-1794', 'Lille': 'lille-1884', 'Rennes': 'rennes-2004',
  'Reims': 'reims-2001', 'Grenoble': 'grenoble-1842', 'Dijon': 'dijon-1827',
  'Tours': 'tours-2091', 'Rouen': 'rouen-2017', 'Metz': 'metz-1907',
  'Nancy': 'nancy-1914', 'Avignon': 'avignon-1778', 'Poitiers': 'poitiers-1962',
  'Besançon': 'besancon-1786', 'Caen': 'caen-1800', 'Orléans': 'orleans-1934',
  'Angers': 'angers-1769', 'Brest': 'brest-1796', 'Limoges': 'limoges-1886',
  'Amiens': 'amiens-1765', 'Perpignan': 'perpignan-1952',
  'La Rochelle': 'la-rochelle-1871', 'Pau': 'pau-1944',
  'Clermont-Ferrand': 'clermont-ferrand-1815', 'Monaco': 'monaco-1909',
  'Aix-en-Provence': 'aix-en-provence-1757', 'Toulon': 'toulon-2083',
  'Saint-Étienne': 'saint-etienne-2025', 'Nîmes': 'nimes-1923',
  'Valence': 'valence-2098', 'Mulhouse': 'mulhouse-1912',
  'Dunkerque': 'dunkerque-1831',
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
  'Aix-en-Provence': { lat: 43.5297, lng: 5.4474 },
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = `${address}, ${city}, France`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=1`,
      { headers: { 'User-Agent': 'PulseMap/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch { /* fallback */ }
  return null;
}

function fixEventDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const now = new Date();
      if (parsed.getFullYear() < now.getFullYear()) {
        const fixed = new Date(parsed);
        fixed.setFullYear(now.getFullYear());
        if (fixed.getTime() < now.getTime() - 86400000) {
          fixed.setFullYear(now.getFullYear() + 1);
        }
        return fixed.toISOString();
      }
      if (parsed.getTime() < now.getTime() - 86400000) {
        return '';
      }
      return parsed.toISOString();
    }
  } catch { /* fallback */ }
  return '';
}

const FOREIGN_KEYWORDS = [
  'genève', 'geneva', 'zürich', 'zurich', 'bern', 'lausanne', 'basel', 'lancy',
  'cumiana', 'torino', 'milano', 'barcelona', 'london', 'bruxelles', 'brussels',
  'deutschland', 'germany', 'schweiz', 'switzerland', 'italia', 'italy', 'españa',
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city } = await req.json();
    if (!city) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing city parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const slug = CITY_SLUGS[city] || city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 30;

    // InfoConcert URL pattern: https://www.infoconcert.com/ville/grenoble-1842
    // Stratégie : scrape exhaustif en batches de 5 pages parallèles, on stoppe
    // dès qu'un batch entier renvoie 0 events. Cap dur à MAX_PAGES par sécurité.
    const baseUrl = `https://www.infoconcert.com/ville/${slug}`;
    const MAX_PAGES = 10;
    const PAGE_BATCH_SIZE = 10;
    const pageUrl = (n: number) => (n === 1 ? baseUrl : `${baseUrl}?page=${n}`);

    const extractSchema = {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Artist or event name/title' },
              venue: { type: 'string', description: 'Venue/salle name (e.g. "La Belle Electrique", "Palais des Sports")' },
              address: { type: 'string', description: 'Full street address with street number, street name, postal code and city (e.g. "12 Rue de la République, 38000 Grenoble"). Do NOT just put the city name.' },
              date: { type: 'string', description: 'Concert date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss). Use the CURRENT YEAR (2026) unless explicitly stated otherwise.' },
              price: { type: 'string', description: 'Price range or "Gratuit" if free' },
              url: { type: 'string', description: 'Event URL on InfoConcert (full URL starting with https://www.infoconcert.com/)' },
              description: { type: 'string', description: 'Genre, style or short description of the concert' },
              genre: { type: 'string', description: 'Music genre: rock, pop, rap, electro, jazz, classique, metal, reggae, chanson, variete, world, folk, blues, hip-hop, rnb, soul, funk, or other' },
            },
            required: ['name'],
          },
        },
      },
      required: ['events'],
    };

    const extractPrompt = `Extract ALL concerts/events listed on this InfoConcert page. The current date is ${new Date().toISOString().slice(0, 10)}. The current year is ${new Date().getFullYear()}. For dates, use ISO 8601 format with the CURRENT YEAR. IMPORTANT: For the address field, extract the FULL STREET ADDRESS (street number, street name, postal code, city) — do NOT just write the city name. If you see a venue/salle name, put it in the venue field separately. Get artist/event name, venue, address, date/time, price, URL (full infoconcert.com URL), description/genre, and music genre tag. Extract EVERY SINGLE event on the page without exception, including multi-date events. Do not stop early. Even events with only a name and date should be extracted.`;

    let rawEvents: any[] = [];

    async function scrapePage(url: string): Promise<any[]> {
      console.log(`Scraping InfoConcert: ${url}`);
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['extract'],
          actions: [
            { type: 'wait', milliseconds: 800 },
            { type: 'scroll', direction: 'down', amount: 4000 },
            { type: 'wait', milliseconds: 500 },
            { type: 'scroll', direction: 'down', amount: 4000 },
            { type: 'wait', milliseconds: 400 },
          ],
          extract: { schema: extractSchema, prompt: extractPrompt },
          waitFor: 2500,
          timeout: 25000,
          location: { country: 'FR', languages: ['fr'] },
        }),
      });
      if (!scrapeResponse.ok) return [];
      const scrapeData = await scrapeResponse.json();
      const extractedData = scrapeData?.data?.extract || scrapeData?.extract || {};
      return extractedData?.events || [];
    }

    // Exhaustive crawl by batches of PAGE_BATCH_SIZE — stop on first empty batch
    let nextPage = 1;
    while (nextPage <= MAX_PAGES) {
      const batchEnd = Math.min(nextPage + PAGE_BATCH_SIZE - 1, MAX_PAGES);
      const batchUrls = [];
      for (let p = nextPage; p <= batchEnd; p++) batchUrls.push(pageUrl(p));

      const batchResults = await Promise.allSettled(batchUrls.map(scrapePage));
      let batchTotal = 0;
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          rawEvents.push(...r.value);
          batchTotal += r.value.length;
        }
      }
      console.log(`[InfoConcert] Pages ${nextPage}-${batchEnd}: ${batchTotal} raw events`);

      // Si le batch entier ne ramène rien on arrête (fin de la pagination)
      if (batchTotal === 0) break;
      nextPage = batchEnd + 1;
    }

    // Deduplicate by name+date before processing
    const seen = new Set<string>();
    rawEvents = rawEvents.filter(e => {
      const key = `${(e.name || '').toLowerCase().slice(0, 40)}-${e.date || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Extracted ${rawEvents.length} raw InfoConcert events for ${city} (up to ${nextPage - 1} pages crawled)`);

    // Step 1: pre-filter (no network calls)
    type Candidate = { e: any; idx: number; startTime: string };
    const candidates: Candidate[] = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (!e.name || e.name.length <= 2) continue;
      const addrLower = (e.address || '').toLowerCase();
      const venueLower = (e.venue || '').toLowerCase();
      if (FOREIGN_KEYWORDS.some(kw => addrLower.includes(kw) || venueLower.includes(kw))) continue;
      const startTime = fixEventDate(e.date || '');
      if (!startTime) continue;
      candidates.push({ e, idx: i, startTime });
    }

    // Step 2: parallel geocoding in chunks (cap at first 80 with address)
    const GEOCODE_CAP = 80;
    const GEOCODE_CONCURRENCY = 8;
    const geocodeResults = new Map<number, { lat: number; lng: number } | null>();
    const toGeocode = candidates.filter(c => c.e.address).slice(0, GEOCODE_CAP);
    for (let i = 0; i < toGeocode.length; i += GEOCODE_CONCURRENCY) {
      const chunk = toGeocode.slice(i, i + GEOCODE_CONCURRENCY);
      const results = await Promise.all(chunk.map(c => geocode(c.e.address, city).catch(() => null)));
      chunk.forEach((c, j) => geocodeResults.set(c.idx, results[j]));
    }

    // Step 3: build final events
    const events: any[] = [];
    for (const { e, idx, startTime } of candidates) {
      let lat = cityCoords.lat;
      let lng = cityCoords.lng;
      let geocoded = false;

      const coords = geocodeResults.get(idx);
      if (coords) {
        const dist = distanceKm(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
        if (dist <= MAX_DISTANCE_KM) {
          lat = coords.lat;
          lng = coords.lng;
          geocoded = true;
        } else {
          continue; // too far
        }
      }

      if (!geocoded) {
        lat += (Math.random() - 0.5) * 0.015;
        lng += (Math.random() - 0.5) * 0.015;
      }

      const id = `ic-${slug}-${idx}-${Date.now()}`;
      const genres: string[] = [];
      if (e.genre && e.genre !== 'other') genres.push(e.genre.toLowerCase());

      events.push({
        id,
        name: e.name,
        venue: e.venue || '',
        address: e.address || '',
        city,
        lat,
        lng,
        startTime,
        endTime: null,
        description: (e.genre ? `[${e.genre}] ` : '') + (e.description || '') + ' • via InfoConcert',
        ticketUrl: e.url || '',
        price: e.price || null,
        genres,
        externalAttendees: null,
      });
    }

    console.log(`Returning ${events.length} valid InfoConcert events for ${city}`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('InfoConcert scrape error:', error);
    return new Response(
      JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
