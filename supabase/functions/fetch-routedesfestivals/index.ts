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

    if (villeSlugs.length > 0) {
      console.log(`[RDF] Scraping ${villeSlugs.length} ville pages for "${city}"...`);
      
      // Scrape ville pages to get festival links
      const villeResults = await Promise.allSettled(
        villeSlugs.map(async (slug) => {
          const villeUrl = `https://www.routedesfestivals.com/ville/${slug}.html`;
          console.log(`[RDF] Scraping ville page: ${villeUrl}`);
          const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: villeUrl,
              formats: ['links'],
              waitFor: 3000,
              location: { country: 'FR', languages: ['fr'] },
            }),
          });
          if (!res.ok) return [];
          const data = await res.json();
          const links: string[] = data?.data?.links || data?.links || [];
          return links.filter((u: string) => u.includes('/festival/') && u.endsWith('.html'));
        })
      );

      for (const r of villeResults) {
        if (r.status === 'fulfilled') {
          festivalUrls.push(...r.value);
        }
      }
    }

    // Fallback: also try map search
    if (festivalUrls.length < 5) {
      console.log(`[RDF] Also trying map search for "${city}"...`);
      try {
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://www.routedesfestivals.com',
            search: city,
            limit: 100,
            includeSubdomains: false,
          }),
        });
        if (mapResponse.ok) {
          const mapData = await mapResponse.json();
          const allLinks: string[] = mapData?.links || [];
          const mapFestUrls = allLinks.filter((u: string) =>
            u.includes('/festival/') && u.endsWith('.html')
          );
          festivalUrls.push(...mapFestUrls);
        }
      } catch (err) {
        console.error(`[RDF] Map error:`, err);
      }
    }

    // Deduplicate URLs
    festivalUrls = [...new Set(festivalUrls)];
    console.log(`[RDF] Found ${festivalUrls.length} unique festival URLs for "${city}"`);

    if (festivalUrls.length === 0) {
      return new Response(
        JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urlsToScrape = festivalUrls.slice(0, 20);
    console.log(`[RDF] Extracting details from ${urlsToScrape.length} festival pages...`);

    const rawEvents: any[] = [];

    // Process in parallel batches of 5
    for (let batchStart = 0; batchStart < urlsToScrape.length; batchStart += 5) {
      const batch = urlsToScrape.slice(batchStart, batchStart + 5);
      const promises = batch.map(async (festUrl) => {
        try {
          const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: festUrl,
              formats: ['extract'],
              extract: {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Festival name' },
                    venue: { type: 'string', description: 'Venue or site name' },
                    cities: { type: 'string', description: 'All cities listed (comma-separated)' },
                    address: { type: 'string', description: 'Full address or main city with postal code' },
                    startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
                    endDate: { type: 'string', description: 'End date in YYYY-MM-DD format, or null if single day' },
                    price: { type: 'string', description: 'Price range or "Gratuit" if free' },
                    description: { type: 'string', description: 'Short description of the festival (max 200 chars)' },
                    genre: { type: 'string', description: 'Music genre: rock, pop, rap, electro, jazz, classique, metal, reggae, chanson, world, folk, blues, hip-hop, or other' },
                  },
                  required: ['name'],
                },
                prompt: `Extract the festival details from this Route des Festivals page. Today is ${new Date().toISOString().slice(0, 10)}. Extract: name, venue, cities, address, start/end dates (YYYY-MM-DD), price, description, genre.`,
              },
              waitFor: 3000,
              location: { country: 'FR', languages: ['fr'] },
            }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const extracted = scrapeData?.data?.extract || scrapeData?.extract || {};
            if (extracted.name) {
              extracted._sourceUrl = festUrl;
              return extracted;
            }
          }
        } catch (err) {
          console.error(`[RDF] Error scraping ${festUrl}:`, err);
        }
        return null;
      });

      const results = await Promise.allSettled(promises);
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          rawEvents.push(r.value);
        }
      }
    }

    console.log(`[RDF] Extracted ${rawEvents.length} festivals from individual pages`);

    const events: any[] = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
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

      const eventCity = e.cities?.split(',')[0]?.trim() || city;
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
        ticketUrl: e._sourceUrl || 'https://www.routedesfestivals.com/',
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
