// Fetch events from OpenAgenda API v2
// Strategy: discover agendas by city search, then fetch their events with geo filter

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
  'Annecy': { lat: 45.8992, lng: 6.1294 }, 'Le Havre': { lat: 49.4944, lng: 0.1079 },
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
    northEastLat: lat + latDelta,
    northEastLng: lng + lngDelta,
    southWestLat: lat - latDelta,
    southWestLng: lng - lngDelta,
  };
}

const EXPO_KEYWORDS = /exposition|musée|museum|galerie|vernissage|patrimoine|visite|monument|château|chateau|jardin|archive/i;
const SPECTACLE_KEYWORDS = /spectacle|théâtre|theatre|danse|cirque|marionnette|opéra|opera|comédie|comedie|ballet|chorale|choeur/i;
const CONCERT_KEYWORDS = /concert|musique|music|festival|jazz|rock|electro|dj|hip.?hop|rap|orchestre|symphoni/i;
const SPORT_KEYWORDS = /sport|course|run|trail|vélo|velo|cyclisme|marathon|foot|rugby|basket|natation|gym|fitness|randonnée|randonnee/i;
const ATELIER_KEYWORDS = /atelier|workshop|stage|formation|conférence|conference|débat|debat|rencontre|lecture|salon|forum|séminaire/i;

function detectOaType(title: string, desc: string, keywords: string[]): { type: string; subtype: string } {
  const all = `${title} ${desc} ${keywords.join(' ')}`.toLowerCase();
  if (SPORT_KEYWORDS.test(all)) return { type: 'sport', subtype: 'sport' };
  if (CONCERT_KEYWORDS.test(all)) return { type: 'concert', subtype: 'concert' };
  if (SPECTACLE_KEYWORDS.test(all)) return { type: 'spectacle', subtype: 'spectacle' };
  if (EXPO_KEYWORDS.test(all)) return { type: 'expo', subtype: 'lieu' };
  if (ATELIER_KEYWORDS.test(all)) return { type: 'afterwork', subtype: 'atelier' };
  return { type: 'spectacle', subtype: 'event' };
}

/** Fetch with API key — use query param as it's more reliable */
async function oaFetch(url: string, apiKey: string): Promise<Response> {
  const separator = url.includes('?') ? '&' : '?';
  return fetch(`${url}${separator}key=${apiKey}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PulseMap/1.0',
    },
  });
}

/** Discover agendas relevant to a city */
async function discoverAgendas(city: string, apiKey: string): Promise<number[]> {
  const uids: number[] = [];
  const searchTerms = [city];
  
  for (const term of searchTerms) {
    const url = `https://api.openagenda.com/v2/agendas?search=${encodeURIComponent(term)}&size=50&official=1`;
    const res = await oaFetch(url, apiKey);
    if (!res.ok) {
      console.error(`[OpenAgenda] Agenda search error: ${res.status}`);
      await res.text();
      continue;
    }
    const data = await res.json();
    const agendas = data?.agendas || [];
    console.log(`[OpenAgenda] Found ${agendas.length} official agendas for "${term}"`);
    for (const a of agendas) {
      if (a.uid && !uids.includes(a.uid)) uids.push(a.uid);
    }
  }

  // Also search without official filter for more coverage
  const url2 = `https://api.openagenda.com/v2/agendas?search=${encodeURIComponent(city)}&size=30`;
  const res2 = await oaFetch(url2, apiKey);
  if (res2.ok) {
    const data2 = await res2.json();
    for (const a of (data2?.agendas || [])) {
      if (a.uid && !uids.includes(a.uid)) uids.push(a.uid);
    }
    console.log(`[OpenAgenda] Total unique agendas: ${uids.length}`);
  } else {
    await res2.text();
  }

  return uids.slice(0, 20); // Cap at 20 agendas to stay within time limits
}

/** Fetch events from a single agenda with geo filter */
async function fetchAgendaEvents(
  agendaUid: number,
  apiKey: string,
  cityCoords: { lat: number; lng: number },
  maxDistKm: number,
  city: string,
): Promise<any[]> {
  const bbox = geoBbox(cityCoords.lat, cityCoords.lng, maxDistKm);
  const events: any[] = [];
  let afterParams: string[] | null = null;
  let page = 0;
  const MAX_PAGES = 3;

  while (page < MAX_PAGES) {
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

    if (afterParams) {
      for (const val of afterParams) params.append('after[]', val);
    }

    const apiUrl = `https://api.openagenda.com/v2/agendas/${agendaUid}/events?${params}`;
    const res = await oaFetch(apiUrl, apiKey);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status !== 404) {
        console.error(`[OpenAgenda] Agenda ${agendaUid} page ${page + 1}: ${res.status} ${errText.slice(0, 100)}`);
      }
      break;
    }

    const data = await res.json();
    const rawEvents = data?.events || [];

    for (const e of rawEvents) {
      const title = e.title?.fr || e.title?.en || Object.values(e.title || {})[0] || '';
      if (!title || title.length <= 2) continue;

      const timing = (e.timings || [])[0];
      if (!timing?.begin) continue;
      const startTime = new Date(timing.begin).toISOString();
      const endTime = timing.end ? new Date(timing.end).toISOString() : null;

      if (new Date(startTime).getTime() < Date.now() - 86400000) continue;

      const eLat = e.location?.latitude;
      const eLng = e.location?.longitude;
      let lat = cityCoords.lat;
      let lng = cityCoords.lng;

      if (eLat && eLng) {
        const dist = distanceKm(eLat, eLng, cityCoords.lat, cityCoords.lng);
        if (dist <= maxDistKm) {
          lat = eLat;
          lng = eLng;
        } else {
          continue;
        }
      } else {
        lat += (Math.random() - 0.5) * 0.015;
        lng += (Math.random() - 0.5) * 0.015;
      }

      const description = e.description?.fr || e.description?.en || Object.values(e.description || {})[0] || '';
      const kw = e.keywords?.fr || e.keywords?.en || [];
      const venue = e.location?.name || '';
      const address = [e.location?.address, e.location?.postalCode, e.location?.city].filter(Boolean).join(', ');
      const eventCity = (e.location?.city || city).replace(/\s*\(\d+\)\s*$/, '').trim();
      const ticketUrl = e.registration?.[0]?.value || e.links?.[0]?.link || e.originalUrl || `https://openagenda.com`;

      const { type, subtype } = detectOaType(title, description, kw);

      events.push({
        id: `oa-${e.uid}`,
        name: title,
        venue,
        address: address || eventCity,
        city: eventCity,
        lat, lng,
        startTime,
        endTime,
        description: (kw.length ? `[${kw.join(', ')}] ` : '') + description + ' • via OpenAgenda',
        ticketUrl,
        price: e.conditions?.fr || (e.registration?.length > 0 ? null : 'Gratuit'),
        genres: kw.slice(0, 5),
        externalAttendees: null,
        oaType: type,
        oaSubtype: subtype,
      });
    }

    afterParams = data?.after || null;
    if (!afterParams || rawEvents.length === 0) break;
    page++;
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
      console.log('[OpenAgenda] No API key set (OPENAGENDA_API_KEY)');
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 50;

    // Step 1: Discover relevant agendas
    const agendaUids = await discoverAgendas(city, apiKey);
    console.log(`[OpenAgenda] Will query ${agendaUids.length} agendas for "${city}"`);

    if (agendaUids.length === 0) {
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Fetch events from each agenda (in batches of 5)
    const allEvents: any[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < agendaUids.length; i += 5) {
      const batch = agendaUids.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(uid => fetchAgendaEvents(uid, apiKey, cityCoords, MAX_DISTANCE_KM, city).catch(err => {
          console.error(`[OpenAgenda] Error on agenda ${uid}:`, err.message);
          return [];
        }))
      );

      for (const evts of results) {
        for (const e of evts) {
          if (!seenIds.has(e.id)) {
            seenIds.add(e.id);
            allEvents.push(e);
          }
        }
      }
    }

    console.log(`[OpenAgenda] Returning ${allEvents.length} unique events for "${city}"`);
    return new Response(JSON.stringify({ success: true, events: allEvents }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[OpenAgenda] Error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }), { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
