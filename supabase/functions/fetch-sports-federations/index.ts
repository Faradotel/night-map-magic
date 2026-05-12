// Fetch sports events from French federation agendas on OpenAgenda
// Strategy: search for sport-related agendas, filter by title, then fetch their upcoming events with geo filter

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

// Regex to validate that an agenda title is actually sport-related
const SPORT_AGENDA_PATTERN = /\b(sport|foot|rugby|tennis|basket|volley|hand|judo|karaté|karate|escrime|gym|athlé|athle|natation|cyclisme|vélo|velo|trail|course|marathon|triathlon|boxe|golf|voile|aviron|canoë|canoe|pétanque|petanque|tir|équitation|equitation|badminton|hockey|surf|plongée|plongee|lutte|taekwondo|ping|musculation|escalade|ski|randonnée|randonnee|CDOS|CROS|FFSA|ligue|comité olympique|comite olympique|fédération française|federation francaise|district|compétition|competition|tournoi|championnat|cross|relais|semi-marathon|10km|5km)\b/i;

// Negative pattern — skip agendas about employment, culture, etc.
const NOT_SPORT_PATTERN = /\b(emploi|insertion|pôle emploi|pole emploi|recrutement|formation professionnelle|bibliothèque|mediatheque|médiathèque|cinéma|cinema|musée|musee|théâtre|theatre)\b/i;

/** Search OpenAgenda for genuine sport agendas */
async function discoverSportAgendas(apiKey: string): Promise<{ uid: number; title: string }[]> {
  const results = new Map<number, string>();

  const searches = [
    'fédération française sport',
    'comité départemental sport',
    'CDOS sport',
    'ligue football rugby tennis',
    'district football',
    'comité rugby basket',
    'club athlétisme cyclisme',
    'tournoi championnat sportif',
    'compétition course trail marathon',
  ];

  for (const term of searches) {
    try {
      const url = `https://api.openagenda.com/v2/agendas?search=${encodeURIComponent(term)}&size=100`;
      const res = await oaFetch(url, apiKey);
      if (!res.ok) { await res.text(); continue; }
      const data = await res.json();
      const agendas = data?.agendas || [];
      let accepted = 0;
      for (const a of agendas) {
        if (!a.uid || results.has(a.uid)) continue;
        const title = a.title || '';
        const desc = a.description || '';
        const combined = `${title} ${desc}`;
        // Must match sport pattern AND not match employment/culture pattern
        if (SPORT_AGENDA_PATTERN.test(combined) && !NOT_SPORT_PATTERN.test(combined)) {
          results.set(a.uid, title);
          accepted++;
        }
      }
      console.log(`[SportsFed] "${term}": ${agendas.length} found, ${accepted} accepted`);
    } catch (err) {
      console.error(`[SportsFed] Search "${term}" failed:`, err);
    }
  }

  console.log(`[SportsFed] Total verified sport agendas: ${results.size}`);
  // Log first 20 titles for debugging
  const entries = [...results.entries()].slice(0, 20);
  for (const [uid, title] of entries) {
    console.log(`  agenda ${uid}: ${title}`);
  }

  return [...results.entries()].map(([uid, title]) => ({ uid, title }));
}

/** Detect specific sport genre from event title/description */
const SPORT_TYPE_MAP: [RegExp, string][] = [
  [/\bfoot(ball)?\b/i, '⚽ Football'],
  [/\brugby\b/i, '🏉 Rugby'],
  [/\btennis\b(?!\s+de\s+table)/i, '🎾 Tennis'],
  [/\bbasket/i, '🏀 Basket'],
  [/\bvolley/i, '🏐 Volley'],
  [/\bhand(ball)?\b/i, '🤾 Handball'],
  [/\bnatation\b/i, '🏊 Natation'],
  [/\bathlé|athlétisme/i, '🏃 Athlétisme'],
  [/\b(cyclisme|vélo|velo|cyclo)/i, '🚴 Cyclisme'],
  [/\bjudo\b/i, '🥋 Judo'],
  [/\bkaraté|karate\b/i, '🥋 Karaté'],
  [/\bescrime\b/i, '🤺 Escrime'],
  [/\bgym(nastique)?\b/i, '🤸 Gymnastique'],
  [/\bski\b/i, '⛷️ Ski'],
  [/\brandonnée|randonnee\b/i, '🥾 Randonnée'],
  [/\bescalade\b/i, '🧗 Escalade'],
  [/\btrail\b/i, '🏃 Trail'],
  [/\b(course|marathon|semi|10km|5km|cross)\b/i, '🏃 Course'],
  [/\btriathlon\b/i, '🏊 Triathlon'],
  [/\bboxe\b/i, '🥊 Boxe'],
  [/\bgolf\b/i, '⛳ Golf'],
  [/\bvoile\b/i, '⛵ Voile'],
  [/\baviron\b/i, '🚣 Aviron'],
  [/\b(canoë|canoe|kayak)\b/i, '🛶 Canoë-Kayak'],
  [/\b(pétanque|petanque)\b/i, '🎯 Pétanque'],
  [/\btir\b/i, '🎯 Tir'],
  [/\b(équitation|equitation)\b/i, '🐎 Équitation'],
  [/\bbadminton\b/i, '🏸 Badminton'],
  [/\bhockey\b/i, '🏒 Hockey'],
  [/\bsurf\b/i, '🏄 Surf'],
  [/\b(plongée|plongee)\b/i, '🤿 Plongée'],
  [/\blutte\b/i, '🤼 Lutte'],
  [/\btaekwondo\b/i, '🥋 Taekwondo'],
  [/\b(ping|tennis de table)\b/i, '🏓 Tennis de table'],
];

function detectSportGenre(title: string, desc: string): string {
  const all = `${title} ${desc}`;
  for (const [regex, genre] of SPORT_TYPE_MAP) {
    if (regex.test(all)) return genre;
  }
  return '🏅 Sport';
}

// Also filter individual events: skip non-sport events from sport agendas
const EVENT_SPORT_PATTERN = /\b(match|tournoi|championnat|compétition|competition|course|cross|trail|marathon|semi|relais|entraînement|entrainement|stage|camp|défi|départ|arrivée|classement|finale|quart|demi|poule|division|equipe|équipe|ligue|coupe|challenge|open|critérium|criterium|prix|trophée|trophee|meeting|interclub|gala|régionale|regionale|nationale|départemental|departemental|inscription|km|podium|sport|athlé|gym|foot|rugby|tennis|basket|volley|hand|judo|karaté|escrime|natation|cyclisme|vélo|trail|triathlon|boxe|golf|voile|aviron|canoë|kayak|pétanque|tir|équitation|badminton|hockey|surf|plongée|lutte|taekwondo|ping|escalade|ski|randonnée|musculation)\b/i;

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

    const description = typeof e.description === 'string' ? e.description : (e.description?.fr || Object.values(e.description || {})[0] || '');

    // Filter: event itself must look sport-related
    if (!EVENT_SPORT_PATTERN.test(`${title} ${description}`)) continue;

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
      description: `${sportGenre} • ${description}`.slice(0, 500) + ' • via Fédération sportive',
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
  // Auth: require service-role bearer (internal call from refresh-events)
  const _serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const _auth = req.headers.get("authorization") || "";
  if (_auth !== `Bearer ${_serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

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

    // Step 1: Discover verified sport federation agendas
    const agendas = await discoverSportAgendas(apiKey);
    if (agendas.length === 0) {
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Fetch events from each agenda filtered by city geo (batches of 10)
    const allEvents: any[] = [];
    const seenIds = new Set<string>();

    // Cap at 80 agendas to stay within time limits
    const cappedAgendas = agendas.slice(0, 80);

    for (let i = 0; i < cappedAgendas.length; i += 10) {
      const batch = cappedAgendas.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(a => fetchSportEvents(a.uid, apiKey, cityCoords, MAX_DISTANCE_KM, city))
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
