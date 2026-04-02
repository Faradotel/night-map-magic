// Scrape Route des Festivals listings for a city using Firecrawl map + extract

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
  'Valence': { lat: 44.9334, lng: 4.8924 },
};

// Map cities to RDF département page slugs
const CITY_DEPT_SLUG: Record<string, string> = {
  'Paris': 'paris-75',
  'Marseille': 'bouches-du-rhone-13',
  'Lyon': 'rhone-69',
  'Toulouse': 'haute-garonne-31',
  'Nice': 'alpes-maritimes-06',
  'Nantes': 'loire-atlantique-44',
  'Montpellier': 'herault-34',
  'Strasbourg': 'bas-rhin-67',
  'Bordeaux': 'gironde-33',
  'Lille': 'nord-59',
  'Rennes': 'ille-et-vilaine-35',
  'Grenoble': 'isere-38',
  'Dijon': 'cote-d-or-21',
  'Reims': 'marne-51',
  'Tours': 'indre-et-loire-37',
  'Rouen': 'seine-maritime-76',
  'Metz': 'moselle-57',
  'Nancy': 'meurthe-et-moselle-54',
  'Avignon': 'vaucluse-84',
  'Poitiers': 'vienne-86',
  'Besançon': 'doubs-25',
  'Caen': 'calvados-14',
  'Orléans': 'loiret-45',
  'Angers': 'maine-et-loire-49',
  'Brest': 'finistere-29',
  'Limoges': 'haute-vienne-87',
  'Amiens': 'somme-80',
  'Perpignan': 'pyrenees-orientales-66',
  'La Rochelle': 'charente-maritime-17',
  'Pau': 'pyrenees-atlantiques-64',
  'Clermont-Ferrand': 'puy-de-dome-63',
  'Aix-en-Provence': 'bouches-du-rhone-13',
  'Toulon': 'var-83',
  'Saint-Étienne': 'loire-42',
  'Nîmes': 'gard-30',
  'Dunkerque': 'nord-59',
  'Mulhouse': 'haut-rhin-68',
  'Valence': 'drome-26',
  'Monaco': 'alpes-maritimes-06',
};

// Map cities to RDF ville page slugs for direct scraping
const CITY_RDF_VILLE: Record<string, string[]> = {
  'Paris': ['paris-1938', 'paris-1-1939', 'paris-2-1940', 'paris-3-1941'],
  'Marseille': ['marseille-1900'],
  'Lyon': ['lyon-1893'],
  'Toulouse': ['toulouse-2086'],
  'Nice': ['nice-1921'],
  'Nantes': ['nantes-1915'],
  'Montpellier': ['montpellier-1911'],
  'Strasbourg': ['strasbourg-2071'],
  'Bordeaux': ['bordeaux-1794'],
  'Lille': ['lille-1884'],
  'Rennes': ['rennes-2004'],
  'Grenoble': ['grenoble-1842', 'meylan-2193'],
  'Dijon': ['dijon-1827'],
  'Reims': ['reims-2001'],
  'Tours': ['tours-2091'],
  'Rouen': ['rouen-2017'],
  'Metz': ['metz-1907'],
  'Nancy': ['nancy-1914'],
  'Avignon': ['avignon-1778'],
  'Poitiers': ['poitiers-1962'],
  'Besançon': ['besancon-1786'],
  'Caen': ['caen-1800'],
  'Orléans': ['orleans-1934'],
  'Angers': ['angers-1769'],
  'Brest': ['brest-1796'],
  'Limoges': ['limoges-1886'],
  'Amiens': ['amiens-1765'],
  'Perpignan': ['perpignan-1952'],
  'La Rochelle': ['la-rochelle-1871'],
  'Pau': ['pau-1944'],
  'Clermont-Ferrand': ['clermont-ferrand-1815'],
  'Aix-en-Provence': ['aix-en-provence-1757'],
  'Toulon': ['toulon-2083'],
  'Saint-Étienne': ['saint-etienne-2025'],
  'Nîmes': ['nimes-1923'],
  'Monaco': ['monaco-1909'],
  'Valence': ['valence-2098'],
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
  if (!dateStr) return '';
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
      if (parsed.getTime() < now.getTime() - 86400000) return '';
      return parsed.toISOString();
    }
  } catch { /* fallback */ }
  return '';
}

const FOREIGN_KEYWORDS = [
  'genève', 'geneva', 'zürich', 'zurich', 'bern', 'lausanne', 'basel',
  'torino', 'milano', 'barcelona', 'london', 'bruxelles', 'brussels',
  'schweiz', 'switzerland', 'italia', 'italy', 'españa', 'belgique', 'luxembourg',
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

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const citySlug = city.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const MAX_DISTANCE_KM = 50;

    // Strategy: Use RDF ville pages directly (more reliable than map search)
    // These pages list all upcoming festivals for a specific city
    const villeSlugs = CITY_RDF_VILLE[city] || [];
    let festivalUrls: string[] = [];

    // Build list of listing pages: ville pages + département page
    // Extract festival data DIRECTLY from listing pages (no per-festival scraping = much faster)
    const pagesToScrape: string[] = [];
    for (const slug of villeSlugs) {
      pagesToScrape.push(`https://www.routedesfestivals.com/ville/${slug}.html`);
    }
    const deptSlug = CITY_DEPT_SLUG[city];
    if (deptSlug) {
      pagesToScrape.push(`https://www.routedesfestivals.com/departement/${deptSlug}.html`);
    }

    if (pagesToScrape.length === 0) {
      return new Response(
        JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RDF] Extracting from ${pagesToScrape.length} listing pages for "${city}"...`);

    const extractSchema = {
      type: 'object',
      properties: {
        festivals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Festival name' },
              venue: { type: 'string', description: 'Venue or site name' },
              city: { type: 'string', description: 'City where the festival takes place' },
              address: { type: 'string', description: 'Address or city with postal code' },
              startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
              endDate: { type: 'string', description: 'End date in YYYY-MM-DD or null' },
              price: { type: 'string', description: 'Price or "Gratuit"' },
              description: { type: 'string', description: 'Genre or short description' },
              url: { type: 'string', description: 'URL of the festival on routedesfestivals.com' },
            },
            required: ['name'],
          },
        },
      },
      required: ['festivals'],
    };

    const extractPrompt = `Extract ALL festivals listed on this Route des Festivals page. Today is ${new Date().toISOString().slice(0, 10)}. Only include upcoming festivals (future dates). Extract every festival: name, venue, city, address, start date, end date, price, description/genre, URL. Use YYYY-MM-DD for dates with year 2026.`;

    const pageResults = await Promise.allSettled(
      pagesToScrape.map(async (pageUrl) => {
        console.log(`[RDF] Extracting: ${pageUrl}`);
        const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['extract'],
            actions: [
              { type: 'wait', milliseconds: 2000 },
              { type: 'scroll', direction: 'down', amount: 3000 },
              { type: 'wait', milliseconds: 1000 },
            ],
            extract: { schema: extractSchema, prompt: extractPrompt },
            waitFor: 4000,
            location: { country: 'FR', languages: ['fr'] },
          }),
        });
        if (!res.ok) return [];
        const data = await res.json();
        const extracted = data?.data?.extract || data?.extract || {};
        return (extracted?.festivals || []).map((f: any) => ({ ...f, _sourceUrl: pageUrl }));
      })
    );

    const rawEvents: any[] = [];
    for (const r of pageResults) {
      if (r.status === 'fulfilled') rawEvents.push(...r.value);
    }

    // Deduplicate by name
    const seenNames = new Set<string>();
    const dedupedEvents = rawEvents.filter(e => {
      const key = (e.name || '').toLowerCase().slice(0, 40);
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    console.log(`[RDF] Extracted ${dedupedEvents.length} festivals from listing pages`);

    const events: any[] = [];
    for (let i = 0; i < dedupedEvents.length; i++) {
      const e = dedupedEvents[i];
      if (!e.name || e.name.length <= 2) continue;

      const combined = `${e.address || ''} ${e.venue || ''} ${e.cities || ''}`.toLowerCase();
      if (FOREIGN_KEYWORDS.some(kw => combined.includes(kw))) continue;

      const endTime = e.endDate ? fixEventDate(e.endDate) || null : null;
      let startTime = fixEventDate(e.startDate || '');
      if (!startTime && e.startDate && endTime) {
        try {
          const parsed = new Date(e.startDate);
          if (!isNaN(parsed.getTime())) startTime = parsed.toISOString();
        } catch { /* skip */ }
      }
      if (!startTime) continue;

      const eventCity = e.city || e.cities?.split(',')[0]?.trim() || city;
      let lat = cityCoords.lat;
      let lng = cityCoords.lng;
      let geocoded = false;

      const cleanAddress = (e.address || eventCity)
        .replace(/\(\d+\)/g, '')
        .replace(/,\s*(FR|France)\s*$/i, '')
        .trim();

      const coords = await geocode(cleanAddress, 'France');
      if (coords) {
        const dist = distanceKm(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
        if (dist <= MAX_DISTANCE_KM) {
          lat = coords.lat;
          lng = coords.lng;
          geocoded = true;
        } else {
          const eventCityNorm = eventCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const targetCityNorm = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (eventCityNorm.includes(targetCityNorm) || targetCityNorm.includes(eventCityNorm)) {
            console.log(`[RDF] Geocode far but city matches, keeping: "${e.name}"`);
          } else {
            console.log(`[RDF] Rejected too far (${dist.toFixed(0)}km): "${e.name}"`);
            continue;
          }
        }
      }

      if (!geocoded) {
        lat += (Math.random() - 0.5) * 0.02;
        lng += (Math.random() - 0.5) * 0.02;
      }

      const id = `rdf-${citySlug}-${i}-${Date.now()}`;
      const genres: string[] = [];
      if (e.genre && e.genre !== 'other') genres.push(e.genre.toLowerCase());

      events.push({
        id,
        name: e.name,
        venue: e.venue || '',
        address: e.address || eventCity,
        city: eventCity,
        lat, lng, startTime,
        endTime: endTime || null,
        description: (e.genre ? `[${e.genre}] ` : '') + (e.description || '') + ' • via Route des Festivals',
        ticketUrl: e.url || e._sourceUrl || 'https://www.routedesfestivals.com/',
        price: e.price || null,
        genres,
        externalAttendees: null,
      });
    }

    console.log(`[RDF] Returning ${events.length} valid festivals for "${city}"`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[RDF] Error:', error);
    return new Response(
      JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
