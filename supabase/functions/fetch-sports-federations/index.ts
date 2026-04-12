// Fetch sports events from French federation agendas on OpenAgenda
// Strategy: search for sport-related agendas, then fetch their upcoming events with geo filter

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
  'Valence': { lat: 44.9334, lng: 4.8924 }, 'Le Havre': { lat: 49.4944, lng: 0.1079 },
  'Versailles': { lat: 48.8014, lng: 2.1301 },
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geoBbox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
  return {
    northEastLat: lat + latDelta, northEastLng: lng + lngDelta,
    southWestLat: lat - latDelta, southWestLng: lng - lngDelta,
  };
}

async function oaFetch(url: string, apiKey: string): Promise<Response> {
  const separator = url.includes('?') ? '&' : '?';
  return fetch(`${url}${separator}key=${apiKey}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'PulseMap/1.0' },
  });
}

// Sport-specific type detection for more granular categorization
const SPORT_TYPE_MAP: Record<string, string> = {
  football: '⚽ Football', rugby: '🏉 Rugby', tennis: '🎾 Tennis',
  basket: '🏀 Basket', volley: '🏐 Volley', handball: '🤾 Handball',
  natation: '🏊 Natation', athlétisme: '🏃 Athlétisme', cyclisme: '🚴 Cyclisme',
  vélo: '🚴 Cyclisme', judo: '🥋 Judo', karaté: '🥋 Karaté',
  escrime: '🤺 Escrime', gymnastique: '🤸 Gymnastique', ski: '⛷️ Ski',
  randonnée: '🥾 Randonnée', randonnee: '🥾 Randonnée', escalade: '🧗 Escalade',
  trail: '🏃 Trail', course: '🏃 Course', marathon: '🏃 Marathon',
  triathlon: '🏊 Triathlon', boxe: '🥊 Boxe', golf: '⛳ Golf',
  voile: '⛵ Voile', aviron: '🚣 Aviron', canoë: '🛶 Canoë',
  pétanque: '🎯 Pétanque', tir: '🎯 Tir', équitation: '🐎 Équitation',
  equitation: '🐎 Équitation', badminton: '🏸 Badminton', hockey: '🏒 Hockey',
  surf: '🏄 Surf', plongée: '🤿 Plongée', lutte: '🤼 Lutte',
  taekwondo: '🥋 Taekwondo', ping: '🏓 Tennis de table',
};

function detectSportGenre(title: string, desc: string): string {
  const all = `${title} ${desc}`.toLowerCase();
  for (const [keyword, genre] of Object.entries(SPORT_TYPE_MAP)) {
    if (all.includes(keyword)) return genre;
  }
  return '🏅 Sport';
}

/** Search OpenAgenda for sport-related agendas */
async function discoverSportAgendas(apiKey: string): Promise<number[]> {
  const uids = new Set<number>();
  const searches = [
    'fédération sport', 'sport département', 'sport comité',
    'compétition sportive', 'CDOS', 'CROS',
    'ligue sport', 'district football', 'comité rugby',
    'club sportif événement', 'tournoi sport',
  ];

  for (const term of searches) {
    try {
      const url = `https://api.openagenda.com/v2/agendas?search=${encodeURIComponent(term)}&size=100`;
      const res = await oaFetch(url, apiKey);
      if (!res.ok) { await res.text(); continue; }
      const data = await res.json();
      for (const a of (data?.agendas || [])) {
        if (a.uid) uids.add(a.uid);
      }
      console.log(`[SportsFed] "${term}": ${data?.agendas?.length || 0} agendas`);
    } catch (err) {
      console.error(`[SportsFed] Search "${term}" failed:`, err);
    }
  }

  console.log(`[SportsFed] Total unique sport agendas discovered: ${uids.size}`);
  return [...uids];
}

/** Fetch events from a sport agenda filtered by city */
async function fetchSportEvents(
  agendaUid: number,
  apiKey: string,
  cityCoords: { lat: number; lng: number },
  maxDistKm: number,
  city: string,
): Promise<any[]> {
  const bbox = geoBbox(cityCoords.lat, cityCoords.lng, maxDistKm);
  const events: any[] = [];

  const params = new URLSearchParams({
    size: '300',
    sort: 'timings.asc',
    monolingual: 'fr',
    'geo[northEast][lat]': bbox.northEastLat.toFixed(4),
    'geo[northEast][lng]': bbox.northEastLng.toFixed(4),
    'geo[southWest][lat]': bbox.southWestLat.toFixed(4),
    'geo[southWest][lng]': bbox.southWestLng.toFixed(4),
  });
  params.append('relative[]', 'current');
  params.append('relative[]', 'upcoming');

  const apiUrl = `https://api.openagenda.com/v2/agendas/${agendaUid}/events?${params}`;
  const res = await oaFetch(apiUrl, apiKey);
  if (!res.ok) { await res.text(); return []; }

  const data = await res.json();
  const rawEvents = data?.events || [];

  for (const e of rawEvents) {
    const title = typeof e.title === 'string' ? e.title : (e.title?.fr || e.title?.en || Object.values(e.title || {})[0] || '');
    if (!title || title.length <= 2) continue;

    const timing = (e.timings || [])[0] || e.nextTiming;
    const beginField = timing?.begin || timing?.start;
    if (!beginField) continue;
    const startTime = new Date(beginField).toISOString();
    const endTime = timing?.end ? new Date(timing.end).toISOString() : null;
    if (new Date(startTime).getTime() < Date.now() - 86400000) continue;

    const eLat = e.location?.latitude;
    const eLng = e.location?.longitude;
    let lat = cityCoords.lat, lng = cityCoords.lng;

    if (eLat && eLng) {
      if (distanceKm(eLat, eLng, cityCoords.lat, cityCoords.lng) > maxDistKm) continue;
      lat = eLat; lng = eLng;
    } else {
      lat += (Math.random() - 0.5) * 0.015;
      lng += (Math.random() - 0.5) * 0.015;
    }

    const description = typeof e.description === 'string' ? e.description : (e.description?.fr || Object.values(e.description || {})[0] || '');
    const kw = Array.isArray(e.keywords) ? e.keywords : (e.keywords?.fr || []);
    const venue = e.location?.name || '';
    const address = [e.location?.address, e.location?.postalCode, e.location?.city].filter(Boolean).join(', ');
    const eventCity = (e.location?.city || city).replace(/\s*\(\d+\)\s*$/, '').trim();
    const ticketUrl = e.registration?.[0]?.value || e.links?.[0]?.link || e.originalUrl || 'https://openagenda.com';
    const sportGenre = detectSportGenre(title, description);

    events.push({
      id: `sf-${e.uid}`,
      name: title,
      venue, address: address || eventCity,
      city: eventCity,
      lat, lng, startTime, endTime,
      description: `${sportGenre} • ${description}`.slice(0, 500) + ' • via OpenAgenda (Fédération)',
      ticketUrl,
      price: e.conditions?.fr || 'Gratuit',
      genres: [sportGenre, ...kw.slice(0, 3)],
      externalAttendees: null,
      oaType: 'sport',
    });
  }

  return events;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { city } = await req.json();
    if (!city) return new Response(JSON.stringify({ success: false, error: 'Missing city' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const apiKey = Deno.env.get('OPENAGENDA_API_KEY');
    if (!apiKey) {
      console.log('[SportsFed] No API key set');
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 60;

    // Step 1: Discover sport federation agendas
    const agendaUids = await discoverSportAgendas(apiKey);
    if (agendaUids.length === 0) {
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Fetch events from each agenda filtered by city geo (batches of 10)
    const allEvents: any[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < agendaUids.length; i += 10) {
      const batch = agendaUids.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(uid => fetchSportEvents(uid, apiKey, cityCoords, MAX_DISTANCE_KM, city))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const e of r.value) {
            if (!seenIds.has(e.id)) { seenIds.add(e.id); allEvents.push(e); }
          }
        }
      }
    }

    console.log(`[SportsFed] Returning ${allEvents.length} sport federation events for "${city}"`);
    return new Response(JSON.stringify({ success: true, events: allEvents }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[SportsFed] Error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }), { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
