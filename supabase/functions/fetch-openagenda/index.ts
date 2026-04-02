// Fetch events from OpenAgenda public API
// Get your free API key at: https://openagenda.com/settings/keys

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { city } = await req.json();
    if (!city) return new Response(JSON.stringify({ success: false, error: 'Missing city' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const apiKey = Deno.env.get('OPENAGENDA_API_KEY');
    if (!apiKey) {
      console.log('[OpenAgenda] No API key set (OPENAGENDA_API_KEY)');
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 30;
    const now = new Date().toISOString();

    // OpenAgenda v2 API: search events by city
    const params = new URLSearchParams({
      key: apiKey,
      size: '100',
      'timings[gte]': now,
      'location[city]': city,
      sort: 'timings.asc',
    });

    const apiUrl = `https://api.openagenda.com/v2/events?${params}`;
    console.log(`[OpenAgenda] Fetching events for "${city}"...`);

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'PulseMap/1.0' },
    });

    if (!res.ok) {
      console.error(`[OpenAgenda] API error: ${res.status}`);
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    const rawEvents = data?.events || [];
    console.log(`[OpenAgenda] Got ${rawEvents.length} events for "${city}"`);

    const events: any[] = [];

    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];

      const title = e.title?.fr || e.title?.en || e.title?.[''] || Object.values(e.title || {})[0] || '';
      if (!title || title.length <= 2) continue;

      // Get first upcoming timing
      const timing = (e.timings || [])[0];
      if (!timing?.begin) continue;
      const startTime = new Date(timing.begin).toISOString();
      const endTime = timing.end ? new Date(timing.end).toISOString() : null;

      // Check if past
      if (new Date(startTime).getTime() < Date.now() - 86400000) continue;

      // Coordinates from OpenAgenda
      const eLat = e.location?.latitude;
      const eLng = e.location?.longitude;
      let lat = cityCoords.lat;
      let lng = cityCoords.lng;

      if (eLat && eLng) {
        const dist = distanceKm(eLat, eLng, cityCoords.lat, cityCoords.lng);
        if (dist <= MAX_DISTANCE_KM) {
          lat = eLat;
          lng = eLng;
        } else {
          console.log(`[OpenAgenda] Rejected too far (${dist.toFixed(0)}km): "${title}"`);
          continue;
        }
      } else {
        lat += (Math.random() - 0.5) * 0.015;
        lng += (Math.random() - 0.5) * 0.015;
      }

      const description = e.description?.fr || e.description?.en || Object.values(e.description || {})[0] || '';
      const keywords = (e.keywords?.fr || e.keywords?.en || []).join(', ');
      const venue = e.location?.name || '';
      const address = [e.location?.address, e.location?.postalCode, e.location?.city].filter(Boolean).join(', ');
      const eventCity = e.location?.city || city;
      const ticketUrl = e.links?.[0]?.link || e.originalUrl || `https://openagenda.com`;

      events.push({
        id: `oa-${e.uid || i}-${Date.now()}`,
        name: title,
        venue,
        address: address || eventCity,
        city: eventCity,
        lat, lng,
        startTime,
        endTime,
        description: (keywords ? `[${keywords}] ` : '') + description + ' • via OpenAgenda',
        ticketUrl,
        price: e.registration?.length > 0 ? null : 'Gratuit',
        genres: [],
        externalAttendees: null,
      });
    }

    console.log(`[OpenAgenda] Returning ${events.length} valid events for "${city}"`);
    return new Response(JSON.stringify({ success: true, events }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[OpenAgenda] Error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }), { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
