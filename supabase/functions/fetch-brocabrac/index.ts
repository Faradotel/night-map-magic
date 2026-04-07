// Scrape Brocabrac listings (brocantes, vide-greniers) for a department using Firecrawl markdown

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

// City → department code (used when called with { city })
const CITY_DEPT: Record<string, string> = {
  'Paris': '75', 'Marseille': '13', 'Lyon': '69', 'Toulouse': '31', 'Nice': '06',
  'Nantes': '44', 'Montpellier': '34', 'Strasbourg': '67', 'Bordeaux': '33',
  'Lille': '59', 'Rennes': '35', 'Reims': '51', 'Saint-Étienne': '42',
  'Le Havre': '76', 'Toulon': '83', 'Grenoble': '38', 'Dijon': '21',
  'Angers': '49', 'Nîmes': '30', 'Clermont-Ferrand': '63', 'Aix-en-Provence': '13',
  'Brest': '29', 'Tours': '37', 'Limoges': '87', 'Amiens': '80', 'Metz': '57',
  'Rouen': '76', 'Perpignan': '66', 'Orléans': '45', 'Caen': '14',
  'Mulhouse': '68', 'Nancy': '54', 'Avignon': '84', 'Poitiers': '86',
  'Pau': '64', 'La Rochelle': '17', 'Besançon': '25', 'Valence': '26',
  'Monaco': '06', 'Dunkerque': '59', 'Versailles': '78', 'Argenteuil': '95',
  'Montreuil': '93', 'Roubaix': '59', 'Tourcoing': '59', 'Nanterre': '92',
  'Courbevoie': '92', 'Vitry-sur-Seine': '94', 'Créteil': '94', 'Colombes': '92',
  'Chambéry': '73', 'Annecy': '74', 'Bayonne': '64', 'Béziers': '34',
  'Cannes': '06', 'Colmar': '68', 'Villeurbanne': '69', 'Le Mans': '72',
  'Lorient': '56', 'Niort': '79', 'Quimper': '29', 'Saint-Brieuc': '22',
  'Saint-Nazaire': '44', 'Tarbes': '65', 'Troyes': '10', 'Vannes': '56',
};

// Department code → approximate center coords (for fallback geocoding)
const DEPT_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  '01': { lat: 46.2, lng: 5.6, name: 'Ain' },
  '02': { lat: 49.5, lng: 3.6, name: 'Aisne' },
  '03': { lat: 46.3, lng: 3.2, name: 'Allier' },
  '04': { lat: 44.1, lng: 6.2, name: 'Alpes-de-Haute-Provence' },
  '05': { lat: 44.7, lng: 6.3, name: 'Hautes-Alpes' },
  '06': { lat: 43.7, lng: 7.1, name: 'Alpes-Maritimes' },
  '07': { lat: 44.7, lng: 4.6, name: 'Ardèche' },
  '08': { lat: 49.6, lng: 4.6, name: 'Ardennes' },
  '09': { lat: 42.9, lng: 1.6, name: 'Ariège' },
  '10': { lat: 48.3, lng: 4.1, name: 'Aube' },
  '11': { lat: 43.2, lng: 2.4, name: 'Aude' },
  '12': { lat: 44.3, lng: 2.6, name: 'Aveyron' },
  '13': { lat: 43.5, lng: 5.1, name: 'Bouches-du-Rhône' },
  '14': { lat: 49.1, lng: -0.4, name: 'Calvados' },
  '15': { lat: 45.0, lng: 2.7, name: 'Cantal' },
  '16': { lat: 45.7, lng: 0.2, name: 'Charente' },
  '17': { lat: 45.9, lng: -0.8, name: 'Charente-Maritime' },
  '18': { lat: 47.1, lng: 2.4, name: 'Cher' },
  '19': { lat: 45.4, lng: 1.8, name: 'Corrèze' },
  '21': { lat: 47.3, lng: 4.8, name: 'Côte-d\'Or' },
  '22': { lat: 48.5, lng: -3.0, name: 'Côtes-d\'Armor' },
  '23': { lat: 46.1, lng: 2.1, name: 'Creuse' },
  '24': { lat: 45.2, lng: 0.7, name: 'Dordogne' },
  '25': { lat: 47.2, lng: 6.4, name: 'Doubs' },
  '26': { lat: 44.7, lng: 5.2, name: 'Drôme' },
  '27': { lat: 49.1, lng: 1.2, name: 'Eure' },
  '28': { lat: 48.3, lng: 1.5, name: 'Eure-et-Loir' },
  '29': { lat: 48.4, lng: -4.2, name: 'Finistère' },
  '2A': { lat: 41.9, lng: 9.0, name: 'Corse-du-Sud' },
  '2B': { lat: 42.4, lng: 9.2, name: 'Haute-Corse' },
  '30': { lat: 44.0, lng: 4.1, name: 'Gard' },
  '31': { lat: 43.5, lng: 1.3, name: 'Haute-Garonne' },
  '32': { lat: 43.7, lng: 0.6, name: 'Gers' },
  '33': { lat: 44.8, lng: -0.6, name: 'Gironde' },
  '34': { lat: 43.6, lng: 3.5, name: 'Hérault' },
  '35': { lat: 48.1, lng: -1.7, name: 'Ille-et-Vilaine' },
  '36': { lat: 46.8, lng: 1.6, name: 'Indre' },
  '37': { lat: 47.3, lng: 0.7, name: 'Indre-et-Loire' },
  '38': { lat: 45.3, lng: 5.6, name: 'Isère' },
  '39': { lat: 46.7, lng: 5.7, name: 'Jura' },
  '40': { lat: 43.9, lng: -0.8, name: 'Landes' },
  '41': { lat: 47.6, lng: 1.3, name: 'Loir-et-Cher' },
  '42': { lat: 45.7, lng: 4.2, name: 'Loire' },
  '43': { lat: 45.1, lng: 3.7, name: 'Haute-Loire' },
  '44': { lat: 47.3, lng: -1.8, name: 'Loire-Atlantique' },
  '45': { lat: 47.9, lng: 2.2, name: 'Loiret' },
  '46': { lat: 44.6, lng: 1.6, name: 'Lot' },
  '47': { lat: 44.3, lng: 0.5, name: 'Lot-et-Garonne' },
  '48': { lat: 44.5, lng: 3.5, name: 'Lozère' },
  '49': { lat: 47.4, lng: -0.7, name: 'Maine-et-Loire' },
  '50': { lat: 48.9, lng: -1.3, name: 'Manche' },
  '51': { lat: 48.9, lng: 3.9, name: 'Marne' },
  '52': { lat: 48.1, lng: 5.3, name: 'Haute-Marne' },
  '53': { lat: 48.1, lng: -0.8, name: 'Mayenne' },
  '54': { lat: 48.7, lng: 6.2, name: 'Meurthe-et-Moselle' },
  '55': { lat: 49.0, lng: 5.4, name: 'Meuse' },
  '56': { lat: 47.8, lng: -2.8, name: 'Morbihan' },
  '57': { lat: 49.0, lng: 6.6, name: 'Moselle' },
  '58': { lat: 47.1, lng: 3.5, name: 'Nièvre' },
  '59': { lat: 50.4, lng: 3.1, name: 'Nord' },
  '60': { lat: 49.4, lng: 2.4, name: 'Oise' },
  '61': { lat: 48.6, lng: 0.1, name: 'Orne' },
  '62': { lat: 50.5, lng: 2.3, name: 'Pas-de-Calais' },
  '63': { lat: 45.7, lng: 3.1, name: 'Puy-de-Dôme' },
  '64': { lat: 43.3, lng: -0.8, name: 'Pyrénées-Atlantiques' },
  '65': { lat: 43.1, lng: 0.1, name: 'Hautes-Pyrénées' },
  '66': { lat: 42.6, lng: 2.5, name: 'Pyrénées-Orientales' },
  '67': { lat: 48.6, lng: 7.5, name: 'Bas-Rhin' },
  '68': { lat: 47.9, lng: 7.2, name: 'Haut-Rhin' },
  '69': { lat: 45.8, lng: 4.7, name: 'Rhône' },
  '70': { lat: 47.6, lng: 6.2, name: 'Haute-Saône' },
  '71': { lat: 46.6, lng: 4.4, name: 'Saône-et-Loire' },
  '72': { lat: 47.9, lng: 0.2, name: 'Sarthe' },
  '73': { lat: 45.5, lng: 6.4, name: 'Savoie' },
  '74': { lat: 46.0, lng: 6.3, name: 'Haute-Savoie' },
  '75': { lat: 48.9, lng: 2.4, name: 'Paris' },
  '76': { lat: 49.5, lng: 1.1, name: 'Seine-Maritime' },
  '77': { lat: 48.6, lng: 2.9, name: 'Seine-et-Marne' },
  '78': { lat: 48.8, lng: 1.9, name: 'Yvelines' },
  '79': { lat: 46.5, lng: -0.4, name: 'Deux-Sèvres' },
  '80': { lat: 49.9, lng: 2.3, name: 'Somme' },
  '81': { lat: 43.8, lng: 2.1, name: 'Tarn' },
  '82': { lat: 44.0, lng: 1.3, name: 'Tarn-et-Garonne' },
  '83': { lat: 43.5, lng: 6.3, name: 'Var' },
  '84': { lat: 44.0, lng: 5.1, name: 'Vaucluse' },
  '85': { lat: 46.7, lng: -1.3, name: 'Vendée' },
  '86': { lat: 46.6, lng: 0.5, name: 'Vienne' },
  '87': { lat: 45.9, lng: 1.3, name: 'Haute-Vienne' },
  '88': { lat: 48.2, lng: 6.4, name: 'Vosges' },
  '89': { lat: 47.8, lng: 3.6, name: 'Yonne' },
  '90': { lat: 47.6, lng: 6.9, name: 'Territoire de Belfort' },
  '91': { lat: 48.5, lng: 2.2, name: 'Essonne' },
  '92': { lat: 48.8, lng: 2.2, name: 'Hauts-de-Seine' },
  '93': { lat: 48.9, lng: 2.5, name: 'Seine-Saint-Denis' },
  '94': { lat: 48.8, lng: 2.5, name: 'Val-de-Marne' },
  '95': { lat: 49.1, lng: 2.2, name: 'Val-d\'Oise' },
};

// Parse brocabrac markdown to extract events
function parseMarkdown(md: string, dept: string): any[] {
  const events: any[] = [];
  const lines = md.split('\n');
  const seen = new Set<string>();

  let currentDate = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const MONTHS: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const dateMatch = line.match(/^#{1,3}\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthName = dateMatch[2].toLowerCase();
      const year = parseInt(dateMatch[3]);
      const monthIdx = MONTHS[monthName];
      if (monthIdx !== undefined) {
        const d = new Date(year, monthIdx, day);
        currentDate = d >= today ? d.toISOString().slice(0, 10) : '';
      }
      continue;
    }

    const eventMatch = line.match(/\[([^\]]+)\]\((https:\/\/brocabrac\.fr\/[^\)]+)\)/);
    if (eventMatch && currentDate) {
      const name = eventMatch[1].replace(/([a-z])([A-Z])/g, '$1 - $2').trim();
      const url = eventMatch[2];

      let postalCode = '';
      let eventType = 'brocante';
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const nextLine = lines[j].trim();
        const pcMatch = nextLine.match(/^(\d{5})$/);
        if (pcMatch) postalCode = pcMatch[1];
        if (nextLine.match(/vide.?grenier/i)) eventType = 'vide-grenier';
        else if (nextLine.match(/brocante/i)) eventType = 'brocante';
        else if (nextLine.match(/vide.?dressing/i)) eventType = 'vide-dressing';
        else if (nextLine.match(/braderie/i)) eventType = 'braderie';
        else if (nextLine.match(/bourse/i)) eventType = 'bourse';
        else if (nextLine.match(/march[eé]/i)) eventType = 'marché';
      }

      const key = `${name.toLowerCase().slice(0, 30)}-${currentDate}`;
      if (seen.has(key)) continue;
      seen.add(key);

      events.push({ name, date: currentDate, postalCode, type: eventType, url });
    }
  }

  return events;
}

async function geocodeQuery(q: string): Promise<{ lat: number; lng: number } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=1`,
        { headers: { 'User-Agent': 'PulseMap/1.0' } }
      );
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      const data = await res.json();
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      return null;
    } catch { /* fallback */ }
  }
  return null;
}

// Fetch exact address from a Brocabrac event page via its JSON-LD Event schema
async function fetchEventAddress(eventUrl: string): Promise<{ address: string; venue: string; city?: string } | null> {
  try {
    const res = await fetch(eventUrl, { headers: { 'User-Agent': 'Mozilla/5.0 PulseMap/1.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = scriptRe.exec(html)) !== null) {
      try {
        const d = JSON.parse(m[1]);
        const items: any[] = Array.isArray(d) ? d : (d['@graph'] ? d['@graph'] : [d]);
        for (const item of items) {
          if (item['@type'] !== 'Event') continue;
          const loc = item.location;
          if (!loc) continue;
          const venue = loc.name || '';
          const addr = loc.address;
          if (!addr) continue;
          const cityName = typeof addr === 'object' ? addr.addressLocality : undefined;
          if (typeof addr === 'string') return { address: addr, venue, city: cityName };
          const parts = [addr.streetAddress, addr.postalCode, addr.addressLocality].filter(Boolean);
          if (parts.length >= 2) return { address: parts.join(', '), venue, city: addr.addressLocality };
        }
      } catch { /* next script */ }
    }
  } catch { /* fallback */ }
  return null;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const city = body.city as string | undefined;
    let dept = body.dept as string | undefined;

    // Resolve department code
    if (!dept && city) {
      dept = CITY_DEPT[city];
    }
    if (!dept) {
      console.log(`[Brocabrac] No dept resolved for city="${city}" dept="${body.dept}"`);
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const deptInfo = DEPT_COORDS[dept] || { lat: 46.6, lng: 2.2, name: dept };
    const fallbackCoords = { lat: deptInfo.lat, lng: deptInfo.lng };

    const url = `https://brocabrac.fr/${dept}/`;
    console.log(`[Brocabrac] Scraping dept ${dept} (${deptInfo.name}): ${url}`);

    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        waitFor: 2000,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });

    if (!scrapeRes.ok) {
      console.error(`[Brocabrac] Scrape failed: ${scrapeRes.status}`);
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    console.log(`[Brocabrac] Got ${markdown.length} chars of markdown for dept ${dept}`);

    const rawEvents = parseMarkdown(markdown, dept);
    console.log(`[Brocabrac] Parsed ${rawEvents.length} events for dept ${dept}`);

    const sliced = rawEvents.slice(0, 60);

    // Fetch exact addresses from each event page in parallel (max 40 to avoid rate limiting)
    const pageData = await Promise.all(sliced.slice(0, 40).map((e: any) => fetchEventAddress(e.url)));
    // Fill remaining with null
    while (pageData.length < sliced.length) pageData.push(null);
    console.log(`[Brocabrac] Got ${pageData.filter(Boolean).length}/${sliced.length} exact addresses`);

    // Build geocoding queries
    const geoQueries = sliced.map((e: any, i: number) => {
      if (pageData[i]?.address) return pageData[i]!.address;
      try {
        const parts = new URL(e.url).pathname.split('/').filter(Boolean);
        return parts[1] ? parts[1].replace(/-/g, ' ') + ', France' : '';
      } catch { return ''; }
    });

    // Geocode unique queries sequentially (Nominatim: max 1 req/sec)
    const geoCache = new Map<string, { lat: number; lng: number }>();
    const uniqueQueries = [...new Set(geoQueries.filter(Boolean))];
    for (const q of uniqueQueries) {
      const coords = await geocodeQuery(q);
      if (coords) geoCache.set(q, coords);
      await new Promise(r => setTimeout(r, 1100)); // respect Nominatim rate limit
    }
    console.log(`[Brocabrac] Geocoded ${geoCache.size}/${uniqueQueries.length} locations`);

    const events = sliced.map((e: any, i: number) => {
      const pd = pageData[i];
      const geoKey = geoQueries[i];
      const coords = (geoKey && geoCache.get(geoKey)) || fallbackCoords;
      const communeSlug = (() => {
        try {
          const parts = new URL(e.url).pathname.split('/').filter(Boolean);
          return parts[1] || '';
        } catch { return ''; }
      })();
      const commune = communeSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const displayCity = pd?.city || commune || deptInfo.name;
      const displayAddress = pd?.address || `${e.postalCode || ''} ${commune || deptInfo.name}`.trim();

      return {
        id: `bb-${dept}-${i}-${e.date}`,
        name: e.name,
        venue: pd?.venue || '',
        address: displayAddress,
        city: displayCity,
        lat: coords.lat,
        lng: coords.lng,
        startTime: new Date(e.date).toISOString(),
        endTime: null,
        description: `[${e.type}] ${e.name} • via Brocabrac`,
        ticketUrl: e.url || url,
        price: 'Gratuit',
        genres: [e.type],
        externalAttendees: null,
      };
    });

    console.log(`[Brocabrac] Returning ${events.length} events for dept ${dept}`);
    return new Response(JSON.stringify({ success: true, events }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[Brocabrac] Error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }), { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
