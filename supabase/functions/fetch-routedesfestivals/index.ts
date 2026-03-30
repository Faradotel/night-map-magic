// Scrape Route des Festivals listings for a city using Firecrawl

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

// French departments/regions mapped to major cities for URL slugs
const CITY_DEPARTMENT: Record<string, string> = {
  'Paris': '75', 'Marseille': '13', 'Lyon': '69', 'Toulouse': '31',
  'Nice': '06', 'Nantes': '44', 'Montpellier': '34', 'Strasbourg': '67',
  'Bordeaux': '33', 'Lille': '59', 'Rennes': '35', 'Reims': '51',
  'Grenoble': '38', 'Dijon': '21', 'Tours': '37', 'Rouen': '76',
  'Metz': '57', 'Nancy': '54', 'Avignon': '84', 'Poitiers': '86',
  'Besançon': '25', 'Caen': '14', 'Orléans': '45', 'Angers': '49',
  'Brest': '29', 'Limoges': '87', 'Amiens': '80', 'Perpignan': '66',
  'La Rochelle': '17', 'Pau': '64', 'Clermont-Ferrand': '63',
  'Aix-en-Provence': '13', 'Monaco': '06', 'Toulon': '83',
  'Saint-Étienne': '42', 'Nîmes': '30', 'Dunkerque': '59', 'Mulhouse': '68',
  'Valence': '26',
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
    const dept = CITY_DEPARTMENT[city];
    const MAX_DISTANCE_KM = 40;

    // Route des Festivals URL: search by city name or department
    // Try department-based URL first, then city-name search
    const citySlug = city.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // The site uses ?ville= or department filter
    const url = dept
      ? `https://www.routedesfestivals.com/index.php?departement=${dept}`
      : `https://www.routedesfestivals.com/index.php?q=${encodeURIComponent(city)}`;

    console.log(`Scraping Route des Festivals for ${city}: ${url}`);

    let rawEvents: any[] = [];

    try {
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
            { type: 'wait', milliseconds: 2000 },
            { type: 'scroll', direction: 'down', amount: 2000 },
            { type: 'wait', milliseconds: 1000 },
            { type: 'scroll', direction: 'down', amount: 2000 },
            { type: 'wait', milliseconds: 1000 },
          ],
          extract: {
            schema: {
              type: 'object',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Festival or event name' },
                      venue: { type: 'string', description: 'Venue or site name' },
                      address: { type: 'string', description: 'Full address with street, postal code and city. If only city is known, put the city name.' },
                      city: { type: 'string', description: 'City where the event takes place' },
                      startDate: { type: 'string', description: 'Start date in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss). Use current year 2026.' },
                      endDate: { type: 'string', description: 'End date in ISO 8601 format if multi-day, or null' },
                      price: { type: 'string', description: 'Price or "Gratuit" if free' },
                      url: { type: 'string', description: 'Event URL on routedesfestivals.com' },
                      description: { type: 'string', description: 'Genre, style or description of the festival' },
                      genre: { type: 'string', description: 'Music genre: rock, pop, rap, electro, jazz, classique, metal, reggae, chanson, variete, world, folk, blues, hip-hop, rnb, soul, funk, or other' },
                    },
                    required: ['name'],
                  },
                },
              },
              required: ['events'],
            },
            prompt: `Extract ALL festivals and events listed on this Route des Festivals page for the city/department. The current date is ${new Date().toISOString().slice(0, 10)}. Only include events taking place in France. For dates, use ISO 8601 format with the correct year (2026 for upcoming events). Extract: festival name, venue, full address (with postal code and city if available), start date, end date (if multi-day), price, URL, description/genre. Extract EVERY event on the page.`,
          },
          waitFor: 6000,
          location: { country: 'FR', languages: ['fr'] },
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const extractedData = scrapeData?.data?.extract || scrapeData?.extract || {};
        rawEvents = extractedData?.events || [];
        console.log(`Extracted ${rawEvents.length} raw Route des Festivals events for ${city}`);
      } else {
        console.error(`Route des Festivals scrape failed: ${scrapeResponse.status}`);
      }
    } catch (err) {
      console.error(`Error scraping Route des Festivals for ${city}:`, err);
    }

    const events: any[] = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (!e.name || e.name.length <= 2) continue;

      // Reject foreign events
      const addrLower = (e.address || '').toLowerCase();
      const venueLower = (e.venue || '').toLowerCase();
      const cityLower = (e.city || '').toLowerCase();
      if (FOREIGN_KEYWORDS.some(kw => addrLower.includes(kw) || venueLower.includes(kw) || cityLower.includes(kw))) {
        console.log(`Rejected foreign: "${e.name}" (${e.address})`);
        continue;
      }

      const startTime = fixEventDate(e.startDate || '');
      if (!startTime) {
        console.log(`Rejected bad date: "${e.name}" (${e.startDate})`);
        continue;
      }

      const endTime = e.endDate ? fixEventDate(e.endDate) || null : null;

      // Geocode using event's own city if provided, else use target city
      const eventCity = e.city || city;
      let lat = cityCoords.lat;
      let lng = cityCoords.lng;
      let geocoded = false;

      if (i < 40) {
        const addressToGeocode = e.address || eventCity;
        const coords = await geocode(addressToGeocode, eventCity);
        if (coords) {
          const dist = distanceKm(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
          if (dist <= MAX_DISTANCE_KM) {
            lat = coords.lat;
            lng = coords.lng;
            geocoded = true;
          } else {
            console.log(`Rejected too far (${dist.toFixed(0)}km): "${e.name}" (${e.address})`);
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
      if (e.genre && e.genre !== 'other') {
        genres.push(e.genre.toLowerCase());
      }

      events.push({
        id,
        name: e.name,
        venue: e.venue || '',
        address: e.address || eventCity,
        city: eventCity,
        lat,
        lng,
        startTime,
        endTime: endTime || null,
        description: (e.genre ? `[${e.genre}] ` : '') + (e.description || '') + ' • via Route des Festivals',
        ticketUrl: e.url || 'https://www.routedesfestivals.com/',
        price: e.price || null,
        genres,
        externalAttendees: null,
      });
    }

    console.log(`Returning ${events.length} valid Route des Festivals events for ${city}`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Route des Festivals scrape error:', error);
    return new Response(
      JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
