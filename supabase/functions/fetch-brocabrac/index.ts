// Scrape Brocabrac listings (brocantes, vide-greniers) for a city using Firecrawl

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

// Map city names to brocabrac department number
// URL format: https://brocabrac.fr/{dept}/
const CITY_BROCABRAC: Record<string, { dept: string }> = {
  'Paris': { dept: '75' }, 'Marseille': { dept: '13' }, 'Lyon': { dept: '69' },
  'Toulouse': { dept: '31' }, 'Nice': { dept: '06' }, 'Nantes': { dept: '44' },
  'Montpellier': { dept: '34' }, 'Strasbourg': { dept: '67' }, 'Bordeaux': { dept: '33' },
  'Lille': { dept: '59' }, 'Rennes': { dept: '35' }, 'Reims': { dept: '51' },
  'Saint-Étienne': { dept: '42' }, 'Le Havre': { dept: '76' }, 'Toulon': { dept: '83' },
  'Grenoble': { dept: '38' }, 'Dijon': { dept: '21' }, 'Angers': { dept: '49' },
  'Nîmes': { dept: '30' }, 'Clermont-Ferrand': { dept: '63' }, 'Aix-en-Provence': { dept: '13' },
  'Brest': { dept: '29' }, 'Tours': { dept: '37' }, 'Limoges': { dept: '87' },
  'Amiens': { dept: '80' }, 'Metz': { dept: '57' }, 'Rouen': { dept: '76' },
  'Perpignan': { dept: '66' }, 'Orléans': { dept: '45' }, 'Caen': { dept: '14' },
  'Mulhouse': { dept: '68' }, 'Nancy': { dept: '54' }, 'Avignon': { dept: '84' },
  'Poitiers': { dept: '86' }, 'Pau': { dept: '64' }, 'La Rochelle': { dept: '17' },
  'Besançon': { dept: '25' }, 'Valence': { dept: '26' }, 'Monaco': { dept: '06' },
  'Dunkerque': { dept: '59' }, 'Versailles': { dept: '78' }, 'Argenteuil': { dept: '95' },
  'Montreuil': { dept: '93' }, 'Roubaix': { dept: '59' }, 'Tourcoing': { dept: '59' },
  'Nanterre': { dept: '92' }, 'Courbevoie': { dept: '92' }, 'Vitry-sur-Seine': { dept: '94' },
  'Créteil': { dept: '94' }, 'Colombes': { dept: '92' }, 'Châteauroux': { dept: '36' },
  'Alençon': { dept: '61' }, 'Auxerre': { dept: '89' }, 'Blois': { dept: '41' },
  'Bourges': { dept: '18' }, 'Brive-la-Gaillarde': { dept: '19' }, 'Charleville-Mézières': { dept: '08' },
  'Châlons-en-Champagne': { dept: '51' }, 'Cherbourg': { dept: '50' }, 'Évreux': { dept: '27' },
  'Gap': { dept: '05' }, 'Laval': { dept: '53' }, 'Le Mans': { dept: '72' },
  'Lorient': { dept: '56' }, 'Niort': { dept: '79' }, 'Quimper': { dept: '29' },
  'Saint-Brieuc': { dept: '22' }, 'Saint-Nazaire': { dept: '44' }, 'Tarbes': { dept: '65' },
  'Troyes': { dept: '10' }, 'Vannes': { dept: '56' }, 'Chambéry': { dept: '73' },
  'Annecy': { dept: '74' }, 'Bayonne': { dept: '64' }, 'Béziers': { dept: '34' },
  'Cannes': { dept: '06' }, 'Colmar': { dept: '68' }, 'Villeurbanne': { dept: '69' },
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
  'Valence': { lat: 44.9334, lng: 4.8924 },
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

    const mapping = CITY_BROCABRAC[city];
    if (!mapping) {
      console.log(`[Brocabrac] No mapping for city "${city}"`);
      return new Response(
        JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 40;
    const url = `https://brocabrac.fr/${mapping.dept}/`;
    console.log(`[Brocabrac] Scraping: ${url}`);

    const extractSchema = {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Event name (e.g. "Vide grenier", "Brocante professionnelle")' },
              city: { type: 'string', description: 'City name' },
              postalCode: { type: 'string', description: 'Postal code (e.g. "38000")' },
              address: { type: 'string', description: 'Street address or location description' },
              type: { type: 'string', description: 'Event type: brocante, vide-grenier, vide-dressing, braderie, bourse, marche' },
              dates: { type: 'array', items: { type: 'string' }, description: 'All event dates in YYYY-MM-DD format' },
              url: { type: 'string', description: 'Full URL of the event on brocabrac.fr' },
            },
            required: ['name'],
          },
        },
      },
      required: ['events'],
    };

    const extractPrompt = `Extract ALL brocantes, vide-greniers, and similar events listed on this Brocabrac page. Today is ${new Date().toISOString().slice(0, 10)}. For each event extract: name, city, postal code, address/location, type (brocante/vide-grenier/vide-dressing/braderie/bourse/marche), ALL upcoming dates in YYYY-MM-DD format, and the full URL. Only include events with future dates.`;

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
          { type: 'wait', milliseconds: 1500 },
          { type: 'scroll', direction: 'down', amount: 3000 },
          { type: 'wait', milliseconds: 1000 },
        ],
        extract: { schema: extractSchema, prompt: extractPrompt },
        waitFor: 3000,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });

    if (!scrapeResponse.ok) {
      console.error(`[Brocabrac] Scrape failed: ${scrapeResponse.status}`);
      return new Response(
        JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const extractedData = scrapeData?.data?.extract || scrapeData?.extract || {};
    const rawEvents = extractedData?.events || [];
    console.log(`[Brocabrac] Extracted ${rawEvents.length} raw events for ${city}`);

    const events: any[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (!e.name || e.name.length <= 2) continue;

      // Each event can have multiple dates
      const dates: string[] = e.dates || [];
      if (dates.length === 0) continue;

      for (const dateStr of dates) {
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) continue;
        if (parsed.getTime() < Date.now() - 86400000) continue;

        const key = `${e.name.toLowerCase().slice(0, 30)}-${dateStr}`;
        if (seen.has(key)) continue;
        seen.add(key);

        let lat = cityCoords.lat;
        let lng = cityCoords.lng;
        let geocoded = false;

        const addr = e.address || '';
        if (addr && i < 30) {
          const fullAddr = `${addr}, ${e.postalCode || ''} ${e.city || city}`;
          const coords = await geocode(fullAddr, city);
          if (coords) {
            const dist = distanceKm(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
            if (dist <= MAX_DISTANCE_KM) {
              lat = coords.lat;
              lng = coords.lng;
              geocoded = true;
            }
          }
        }

        if (!geocoded) {
          lat += (Math.random() - 0.5) * 0.015;
          lng += (Math.random() - 0.5) * 0.015;
        }

        const id = `bb-${mapping.dept}-${i}-${dateStr}-${Date.now()}`;
        const eventType = (e.type || 'brocante').toLowerCase();

        events.push({
          id,
          name: e.name,
          venue: '',
          address: `${addr}${e.postalCode ? ', ' + e.postalCode : ''} ${e.city || city}`.trim(),
          city: e.city || city,
          lat, lng,
          startTime: parsed.toISOString(),
          endTime: null,
          description: `[${eventType}] ${e.name} • via Brocabrac`,
          ticketUrl: e.url || url,
          price: 'Gratuit',
          genres: [eventType],
          externalAttendees: null,
        });
      }
    }

    console.log(`[Brocabrac] Returning ${events.length} valid events for ${city}`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Brocabrac] Error:', error);
    return new Response(
      JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
