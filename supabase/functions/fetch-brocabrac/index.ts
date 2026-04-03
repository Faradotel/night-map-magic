// Scrape Brocabrac listings (brocantes, vide-greniers) for a city using Firecrawl markdown

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

// Parse brocabrac markdown to extract events
function parseMarkdown(md: string, dept: string, city: string, baseUrl: string): any[] {
  const events: any[] = [];
  const lines = md.split('\n');
  const seen = new Set<string>();

  let currentDate = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Month names in French
  const MONTHS: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match date headers like "## 04 Avril 2026" or "## 05 Avril 2026"
    const dateMatch = line.match(/^#{1,3}\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthName = dateMatch[2].toLowerCase();
      const year = parseInt(dateMatch[3]);
      const monthIdx = MONTHS[monthName];
      if (monthIdx !== undefined) {
        const d = new Date(year, monthIdx, day);
        if (d >= today) {
          currentDate = d.toISOString().slice(0, 10);
        } else {
          currentDate = '';
        }
      }
      continue;
    }

    // Match event links like "[GrenobleVide grenier](https://brocabrac.fr/38/grenoble/1352385-vide-grenier)"
    const eventMatch = line.match(/\[([^\]]+)\]\((https:\/\/brocabrac\.fr\/[^\)]+)\)/);
    if (eventMatch && currentDate) {
      const name = eventMatch[1].replace(/([a-z])([A-Z])/g, '$1 - $2').trim();
      const url = eventMatch[2];

      // Look at next lines for postal code and type
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
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=1`,
      { headers: { 'User-Agent': 'PulseMap/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* fallback */ }
  return null;
}

// Fetch exact address from a Brocabrac event page via its JSON-LD Event schema
async function fetchEventAddress(eventUrl: string): Promise<{ address: string; venue: string } | null> {
  try {
    const res = await fetch(eventUrl, { headers: { 'User-Agent': 'Mozilla/5.0 PulseMap/1.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    // Find all JSON-LD blocks and look for @type: Event
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
          if (typeof addr === 'string') return { address: addr, venue };
          const parts = [addr.streetAddress, addr.postalCode, addr.addressLocality].filter(Boolean);
          if (parts.length >= 2) return { address: parts.join(', '), venue };
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
    const { city } = await req.json();
    if (!city) return new Response(JSON.stringify({ success: false, error: 'Missing city' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const dept = CITY_DEPT[city];
    if (!dept) {
      console.log(`[Brocabrac] No dept for "${city}"`);
      return new Response(JSON.stringify({ success: true, events: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const url = `https://brocabrac.fr/${dept}/`;
    console.log(`[Brocabrac] Scraping: ${url}`);

    // Use markdown format (much faster, no 408 timeout)
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
    console.log(`[Brocabrac] Got ${markdown.length} chars of markdown`);

    const rawEvents = parseMarkdown(markdown, dept, city, url);
    console.log(`[Brocabrac] Parsed ${rawEvents.length} events for ${city}`);

    const sliced = rawEvents.slice(0, 60);

    // Fetch exact addresses from each event page in parallel
    const pageData = await Promise.all(sliced.map((e: any) => fetchEventAddress(e.url)));
    console.log(`[Brocabrac] Got ${pageData.filter(Boolean).length}/${sliced.length} exact addresses`);

    // Build geocoding queries: exact address if available, else commune slug
    const geoQueries = sliced.map((e: any, i: number) => {
      if (pageData[i]?.address) return pageData[i]!.address;
      try {
        const parts = new URL(e.url).pathname.split('/').filter(Boolean);
        return parts[1] ? parts[1].replace(/-/g, ' ') + ', France' : '';
      } catch { return ''; }
    });

    // Geocode unique queries in parallel
    const geoCache = new Map<string, { lat: number; lng: number }>();
    const uniqueQueries = [...new Set(geoQueries.filter(Boolean))];
    await Promise.all(uniqueQueries.map(async (q) => {
      const coords = await geocodeQuery(q);
      if (coords) geoCache.set(q, coords);
    }));
    console.log(`[Brocabrac] Geocoded ${geoCache.size}/${uniqueQueries.length} locations`);

    const events = sliced.map((e: any, i: number) => {
      const pd = pageData[i];
      const geoKey = geoQueries[i];
      const coords = (geoKey && geoCache.get(geoKey)) || cityCoords;
      const communeSlug = (() => {
        try {
          const parts = new URL(e.url).pathname.split('/').filter(Boolean);
          return parts[1] || '';
        } catch { return ''; }
      })();
      const commune = communeSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const displayAddress = pd?.address || `${e.postalCode || ''} ${commune || city}`.trim();

      return {
        id: `bb-${dept}-${i}-${e.date}-${Date.now()}`,
        name: e.name,
        venue: pd?.venue || '',
        address: displayAddress,
        city,
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

    console.log(`[Brocabrac] Returning ${events.length} events for ${city}`);
    return new Response(JSON.stringify({ success: true, events }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[Brocabrac] Error:', error);
    return new Response(JSON.stringify({ success: true, events: [] }), { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
