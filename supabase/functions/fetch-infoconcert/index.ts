// InfoConcert HTML scraper — direct parsing (no Firecrawl) for maximum speed.
// La page /ville/<slug>-<id> est entièrement server-rendered : on parse en regex.

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

// Slugs verified against infoconcert.com — major cities use new numeric IDs,
// smaller cities still use the legacy slug-id format.
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

const MONTHS_FR: Record<string, number> = {
  'janvier': 0, 'février': 1, 'fevrier': 1, 'mars': 2, 'avril': 3, 'mai': 4,
  'juin': 5, 'juillet': 6, 'août': 7, 'aout': 7, 'septembre': 8,
  'octobre': 9, 'novembre': 10, 'décembre': 11, 'decembre': 11,
};

function parseFrenchDate(s: string): string {
  // e.g. "Lundi 11 mai 2026 à 20h00" or "Du 11 mai 2026 au 15 mai 2026" — or already ISO
  if (!s) return '';
  // ISO passthrough (RSC payload already gives us "2026-07-04T19:00:00.000Z")
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  const m = s.match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})(?:[^0-9]+(\d{1,2})h(\d{2})?)?/i);
  if (!m) return '';
  const day = parseInt(m[1], 10);
  const month = MONTHS_FR[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  const hour = m[4] ? parseInt(m[4], 10) : 20;
  const min = m[5] ? parseInt(m[5], 10) : 0;
  if (month === undefined) return '';
  const d = new Date(Date.UTC(year, month, day, hour, min, 0));
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à')
    .replace(/&ccedil;/g, 'ç').replace(/&ecirc;/g, 'ê');
}

function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeOnce(q: string): Promise<{ lat: number; lng: number } | null> {
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

// Build a "venue key" by normalizing variant names of the same place into one.
// e.g. "Alpes Congres (alpexpo) - Salle Dauphine A Grenoble" and
// "Auditorium Alpexpo Grenoble" should both collapse to "alpexpo grenoble".
function venueKey(v: string, city: string): string {
  let s = v.toLowerCase();
  // If there's a parenthetical, prefer it (often the popular name)
  const paren = s.match(/\(([^)]+)\)/);
  if (paren) s = paren[1];
  s = s
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s*-\s*salle\s+[^-]+$/i, ' ')
    .replace(/^salle\s+[^-]+-\s*/i, ' ')
    .replace(/\bauditorium\b/g, ' ')
    .replace(/\bsalle\s+\w+\b/g, ' ')
    .replace(/\ba\s+/g, ' ')
    .replace(/\bde\s+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Ensure city is in the key for disambiguation
  const cityLow = city.toLowerCase();
  if (!s.includes(cityLow)) s = `${s} ${cityLow}`;
  return s.trim();
}

// Generate ordered geocoding candidates from most to least specific.
function geocodeCandidates(v: string, city: string): string[] {
  const out: string[] = [];
  const orig = v.replace(/\s+/g, ' ').trim();
  const paren = orig.match(/\(([^)]+)\)/);
  if (paren) out.push(`${paren[1].trim()}, ${city}, France`);
  // Strip parenthetical content
  const noParen = orig.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (noParen) out.push(`${noParen}, ${city}, France`);
  // Strip " A <City>" suffix and "Salle X -" prefix
  const cleaned = noParen
    .replace(/\s+a\s+[a-zà-ÿ-]+$/i, '')
    .replace(/^salle\s+[^-]+-\s*/i, '')
    .trim();
  if (cleaned && !out.includes(`${cleaned}, ${city}, France`)) {
    out.push(`${cleaned}, ${city}, France`);
  }
  // Drop common prefixes (Auditorium, Salle, Théâtre, Palais, etc.) — keeps proper name
  const noPrefix = cleaned
    .replace(/^(auditorium|salle|théâtre|theatre|palais|complexe|centre|center|stade|arena|hall|espace|maison)\s+/i, '')
    .replace(/\bsalle\s+\w+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (noPrefix && noPrefix !== cleaned) out.push(`${noPrefix}, ${city}, France`);
  // Also try without the trailing city word (in case it duplicates the city we append)
  const noCity = noPrefix.replace(new RegExp(`\\s+${city.toLowerCase()}\\s*$`, 'i'), '').trim();
  if (noCity && noCity !== noPrefix) out.push(`${noCity}, ${city}, France`);
  return [...new Set(out)].filter(Boolean);
}

async function geocodeVenue(v: string, city: string): Promise<{ lat: number; lng: number } | null> {
  for (const q of geocodeCandidates(v, city)) {
    const hit = await geocodeOnce(q);
    if (hit) return hit;
  }
  return null;
}

interface RawCard {
  name: string;
  url: string;
  date: string;
  venue: string;
  ville: string;
  id: string;
}

// New: parse concerts directly from the React-Server-Components payload
// embedded in `self.__next_f.push([..., "<json-string>"])` chunks.
// This is the authoritative data source — works for ALL cities (including
// the big ones where the static HTML only shows skeletons).
function parseRscPayload(html: string, expectedCity: string): RawCard[] {
  const cards: RawCard[] = [];
  // Unescape the JS-string-encoded JSON
  const unesc = html
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\n/g, '\n');

  const expected = expectedCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const seen = new Set<string>();
  const idRe = /\{"id":"(\d{6,8})","iri":"\/api\/concerts\/\1","status"/g;
  let mm: RegExpExecArray | null;
  while ((mm = idRe.exec(unesc)) !== null) {
    const cid = mm[1];
    if (seen.has(cid)) continue;

    // Brace-match to find the full concert object
    let depth = 0, i = mm.index, inStr = false;
    for (; i < unesc.length; i++) {
      const ch = unesc[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) break; }
    }
    if (depth !== 0) continue;
    const block = unesc.slice(mm.index, i + 1);

    let obj: any;
    try { obj = JSON.parse(block); } catch { continue; }
    const lineUp = obj.lineUp?.[0]?.name || obj.firstPart?.[0]?.name;
    if (!lineUp) continue;
    const venueName = obj.venue?.name || '';
    const cityName = obj.venue?.city?.name || '';
    if (!cityName) continue;
    // Only keep events whose venue city matches the requested city
    const cn = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (cn !== expected) continue;
    const rawDate: string | undefined = obj.dates?.[0]?.date;
    if (!rawDate) continue;
    const isoDate = rawDate.replace(/^\$D/, ''); // already ISO

    seen.add(cid);
    cards.push({
      name: lineUp,
      url: `https://www.infoconcert.com/concerts/${cid}`,
      date: isoDate,        // pre-parsed ISO — parseFrenchDate will detect and return as-is
      venue: venueName,
      ville: cityName,
      id: cid,
    });
  }
  return cards;
}

function parsePage(html: string, citySlug: string, expectedCity?: string): RawCard[] {
  // Prefer the structured RSC payload (works on modern InfoConcert pages)
  if (expectedCity) {
    const rsc = parseRscPayload(html, expectedCity);
    if (rsc.length) return rsc;
  }
  const cards: RawCard[] = [];
  const seen = new Set<string>();
  const urlRe = /href="(\/concerts\/concert-[a-z0-9-]+-(\d+))"/gi;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(html)) !== null) {
    const path = m[1];
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);

    const start = Math.max(0, m.index - 3500);
    const block = html.slice(start, m.index + 200);

    const artistM = block.match(/<a\s+href="\/artiste\/[^"]+">([^<]+)<\/a>/i);
    const name = artistM ? stripTags(artistM[1]) : '';

    const dateM = block.match(/(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche|Du)\s+[^<]*?\d{4}[^<]*/i);
    const date = dateM ? stripTags(dateM[0]) : '';

    const venueM = block.match(/<a\s+href="\/salle\/[^"]+">([^<]+)<\/a>/i);
    const venue = venueM ? stripTags(venueM[1]) : '';

    const villeM = block.match(/<a\s+href="\/ville\/([a-z0-9-]+)"/i);
    const ville = villeM ? villeM[1] : citySlug;

    if (!name) continue;
    cards.push({ name, url: `https://www.infoconcert.com${path}`, date, venue, ville, id });
  }
  return cards;
}


async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
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
    if (!city) {
      return new Response(JSON.stringify({ success: false, error: 'Missing city' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const slug = CITY_SLUGS[city] || city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 35;
    const baseUrl = `https://www.infoconcert.com/ville/${slug}`;

    // Page 1 first to discover total pages from the pagination
    const firstHtml = await fetchPage(baseUrl);
    if (!firstHtml) {
      return new Response(JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Detect max page from `?page=NN` links
    const pageNums = [...firstHtml.matchAll(/\?page=(\d+)/g)].map(m => parseInt(m[1], 10));
    const maxPage = pageNums.length ? Math.min(Math.max(...pageNums), 25) : 1;
    console.log(`[InfoConcert] ${city} – detected ${maxPage} pages`);

    let allCards: RawCard[] = parsePage(firstHtml, slug, city);

    if (maxPage > 1) {
      const urls: string[] = [];
      for (let p = 2; p <= maxPage; p++) urls.push(`${baseUrl}?page=${p}`);
      // Parallel fetch (8 concurrent)
      const CONCURRENCY = 8;
      for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const chunk = urls.slice(i, i + CONCURRENCY);
        const htmls = await Promise.all(chunk.map(fetchPage));
        htmls.forEach(h => h && allCards.push(...parsePage(h, slug, city)));
      }
    }

    // Dedup by id
    const byId = new Map<string, RawCard>();
    for (const c of allCards) if (!byId.has(c.id)) byId.set(c.id, c);
    allCards = [...byId.values()];

    console.log(`[InfoConcert] ${city} – ${allCards.length} unique cards`);

    // Geocode unique venue KEYS (collapses variants like "Alpexpo - Salle X" + "Auditorium Alpexpo")
    const venueToKey = new Map<string, string>();
    for (const c of allCards) {
      if (c.venue && !venueToKey.has(c.venue)) venueToKey.set(c.venue, venueKey(c.venue, city));
    }
    const uniqueKeys = [...new Set(venueToKey.values())];
    // Pick a representative original venue string per key for candidate generation
    const keyToVenue = new Map<string, string>();
    for (const [v, k] of venueToKey) if (!keyToVenue.has(k)) keyToVenue.set(k, v);

    console.log(`[InfoConcert] ${city} – geocoding ${uniqueKeys.length} unique venue keys (from ${venueToKey.size} variants)`);
    const GEOCODE_CONCURRENCY = 8;
    const keyCoords = new Map<string, { lat: number; lng: number } | null>();
    for (let i = 0; i < uniqueKeys.length; i += GEOCODE_CONCURRENCY) {
      const chunk = uniqueKeys.slice(i, i + GEOCODE_CONCURRENCY);
      const results = await Promise.all(chunk.map(k => geocodeVenue(keyToVenue.get(k)!, city)));
      chunk.forEach((k, j) => keyCoords.set(k, results[j]));
    }

    const events: any[] = [];
    const nowTs = Date.now();
    // For venues that fail to geocode: cluster all events of the SAME venue at one
    // consistent point (city center + small deterministic offset per venue key).
    let unknownIdx = 0;
    const unknownKey = new Map<string, number>();
    for (const c of allCards) {
      const startTime = parseFrenchDate(c.date);
      if (!startTime) continue;
      if (new Date(startTime).getTime() < nowTs - 86400000) continue; // skip past

      let lat = cityCoords.lat;
      let lng = cityCoords.lng;
      const k = c.venue ? venueToKey.get(c.venue) : undefined;
      const coords = k ? keyCoords.get(k) : null;
      if (coords) {
        const dist = distanceKm(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
        if (dist > MAX_DISTANCE_KM) continue; // outside city radius
        lat = coords.lat;
        lng = coords.lng;
      } else if (k) {
        if (!unknownKey.has(k)) unknownKey.set(k, unknownIdx++);
        const idx = unknownKey.get(k)!;
        const angle = idx * 2.39996; // golden-angle spread
        const r = 0.004;
        lat += Math.cos(angle) * r;
        lng += Math.sin(angle) * r;
      }

      events.push({
        id: `ic-${c.id}`,
        name: c.name,
        venue: c.venue,
        address: c.venue ? `${c.venue}, ${city}` : '',
        city,
        lat,
        lng,
        startTime,
        endTime: null,
        description: `Concert ${c.name}${c.venue ? ' à ' + c.venue : ''} • via InfoConcert`,
        ticketUrl: c.url,
        price: null,
        genres: [],
        externalAttendees: null,
      });
    }

    console.log(`[InfoConcert] ${city} – returning ${events.length} events`);
    return new Response(JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('InfoConcert scrape error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
