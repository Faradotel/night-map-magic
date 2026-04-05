// Scrape RunTrail running/trail events by department using Firecrawl

const ALLOWED_ORIGINS = [
  'https://pulse-map.live', 'https://www.pulse-map.live',
  'https://pulsemap-official.lovable.app',
  'https://id-preview--558c7333-dd3f-4317-a4d6-54b2b3b30b02.lovable.app',
  'http://localhost:5173', 'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// City → RunTrail department slug
const CITY_DEPT: Record<string, string> = {
  'Paris': 'paris', 'Marseille': 'bouches-du-rhone', 'Lyon': 'rhone',
  'Toulouse': 'haute-garonne', 'Nice': 'alpes-maritimes', 'Nantes': 'loire-atlantique',
  'Montpellier': 'herault', 'Strasbourg': 'bas-rhin', 'Bordeaux': 'gironde',
  'Lille': 'nord', 'Rennes': 'ille-et-vilaine', 'Reims': 'marne',
  'Saint-Étienne': 'loire', 'Le Havre': 'seine-maritime', 'Toulon': 'var',
  'Grenoble': 'isere', 'Dijon': 'cote-d-or', 'Angers': 'maine-et-loire',
  'Nîmes': 'gard', 'Clermont-Ferrand': 'puy-de-dome', 'Aix-en-Provence': 'bouches-du-rhone',
  'Brest': 'finistere', 'Tours': 'indre-et-loire', 'Limoges': 'haute-vienne',
  'Amiens': 'somme', 'Metz': 'moselle', 'Rouen': 'seine-maritime',
  'Perpignan': 'pyrenees-orientales', 'Orléans': 'loiret', 'Caen': 'calvados',
  'Mulhouse': 'haut-rhin', 'Nancy': 'meurthe-et-moselle', 'Avignon': 'vaucluse',
  'Poitiers': 'vienne', 'Pau': 'pyrenees-atlantiques', 'La Rochelle': 'charente-maritime',
  'Besançon': 'doubs', 'Valence': 'drome', 'Monaco': 'alpes-maritimes',
  'Dunkerque': 'nord', 'Versailles': 'yvelines', 'Argenteuil': 'val-d-oise',
  'Montreuil': 'seine-saint-denis', 'Roubaix': 'nord', 'Tourcoing': 'nord',
  'Nanterre': 'hauts-de-seine', 'Courbevoie': 'hauts-de-seine',
  'Vitry-sur-Seine': 'val-de-marne', 'Créteil': 'val-de-marne',
  'Colombes': 'hauts-de-seine', 'Chambéry': 'savoie', 'Annecy': 'haute-savoie',
  'Bayonne': 'pyrenees-atlantiques', 'Béziers': 'herault', 'Cannes': 'alpes-maritimes',
  'Colmar': 'haut-rhin', 'Villeurbanne': 'rhone', 'Le Mans': 'sarthe',
  'Lorient': 'morbihan', 'Niort': 'deux-sevres', 'Quimper': 'finistere',
  'Saint-Brieuc': 'cotes-d-armor', 'Saint-Nazaire': 'loire-atlantique',
  'Tarbes': 'hautes-pyrenees', 'Troyes': 'aube', 'Vannes': 'morbihan',
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
  'Valence': { lat: 44.9334, lng: 4.8924 }, 'Chambéry': { lat: 45.5646, lng: 5.9178 },
  'Annecy': { lat: 45.8992, lng: 6.1294 },
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', France')}&countrycodes=fr&limit=1`,
      { headers: { 'User-Agent': 'PulseMap/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* fallback */ }
  return null;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      if (parsed.getTime() < Date.now() - 86400000) return '';
      return parsed.toISOString();
    }
  } catch { /* skip */ }
  return '';
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { city } = await req.json();
    if (!city) return new Response(JSON.stringify({ success: false, error: 'Missing city' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const dept = CITY_DEPT[city];
    if (!dept) {
      console.log(`[RunTrail] No department mapping for "${city}"`);
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 60;
    const url = `https://www.runtrail.run/events?departement=${dept}`;
    console.log(`[RunTrail] Scraping ${city} (${dept}): ${url}`);

    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: ['extract'],
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 4000 },
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
                    name: { type: 'string', description: 'Race name' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                    city: { type: 'string', description: 'City where the race takes place' },
                    distance: { type: 'string', description: 'Distance (e.g. "10km", "Trail 25km", "Semi-marathon")' },
                    elevation: { type: 'string', description: 'Elevation gain (D+) if trail' },
                    url: { type: 'string', description: 'Full URL of the event on runtrail.run' },
                    type: { type: 'string', description: 'Race type: trail, route, cross, marche, triathlon, cyclisme, or other' },
                  },
                  required: ['name'],
                },
              },
            },
            required: ['events'],
          },
          prompt: `Extract ALL running/trail races listed on this page. Today is ${new Date().toISOString().slice(0, 10)}. Only include upcoming races. For each: name, date (YYYY-MM-DD), city, distance, elevation (D+), URL, type (trail/route/cross/marche/triathlon/other).`,
        },
        waitFor: 4000,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });

    let rawEvents: any[] = [];
    if (scrapeRes.ok) {
      const data = await scrapeRes.json();
      rawEvents = data?.data?.extract?.events || data?.extract?.events || [];
      console.log(`[RunTrail] Extracted ${rawEvents.length} raw events for ${city}`);
    }

    const events: any[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (!e.name || e.name.length <= 2) continue;

      const startTime = parseDate(e.date || '');
      if (!startTime) continue;

      const key = `${e.name.toLowerCase().slice(0, 30)}-${e.date}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Strip department codes like "(13)" from city names
      const rawCity = e.city || city;
      const eventCity = rawCity.replace(/\s*\(\d+\)\s*$/, '').trim();
      let lat = cityCoords.lat;
      let lng = cityCoords.lng;

      // Geocode the event city if different from target city
      if (i < 30) {
        const coords = await geocode(eventCity);
        if (coords) {
          const dist = distanceKm(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
          if (dist <= MAX_DISTANCE_KM) {
            lat = coords.lat + (Math.random() - 0.5) * 0.01;
            lng = coords.lng + (Math.random() - 0.5) * 0.01;
          } else {
            console.log(`[RunTrail] Rejected too far (${dist.toFixed(0)}km): "${e.name}" @ ${eventCity}`);
            continue;
          }
        } else {
          lat += (Math.random() - 0.5) * 0.02;
          lng += (Math.random() - 0.5) * 0.02;
        }
      }

      const raceType = (e.type || 'course').toLowerCase();
      const desc = [e.distance, e.elevation ? `D+${e.elevation}` : null, raceType].filter(Boolean).join(' • ');

      events.push({
        id: `rt-${dept}-${i}-${Date.now()}`,
        name: e.name,
        venue: '',
        address: eventCity,
        city: eventCity,
        lat, lng,
        startTime,
        endTime: null,
        description: `[${raceType}] ${desc} • via RunTrail`,
        ticketUrl: e.url || url,
        price: null,
        genres: [raceType],
        externalAttendees: null,
      });
    }

    console.log(`[RunTrail] Returning ${events.length} events for ${city}`);
    return new Response(JSON.stringify({ success: true, events }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[RunTrail] Error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }), { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
