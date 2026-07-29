// Scrape Meetup listings for a city using Firecrawl

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

const CITY_SLUGS: Record<string, string> = {
  'Paris': 'fr--Paris', 'Marseille': 'fr--Marseille', 'Lyon': 'fr--Lyon',
  'Toulouse': 'fr--Toulouse', 'Nice': 'fr--Nice', 'Nantes': 'fr--Nantes',
  'Montpellier': 'fr--Montpellier', 'Strasbourg': 'fr--Strasbourg',
  'Bordeaux': 'fr--Bordeaux', 'Lille': 'fr--Lille', 'Rennes': 'fr--Rennes',
  'Reims': 'fr--Reims', 'Grenoble': 'fr--Grenoble', 'Dijon': 'fr--Dijon',
  'Tours': 'fr--Tours', 'Rouen': 'fr--Rouen', 'Metz': 'fr--Metz',
  'Nancy': 'fr--Nancy', 'Avignon': 'fr--Avignon', 'Poitiers': 'fr--Poitiers',
  'Besançon': 'fr--Besançon', 'Caen': 'fr--Caen', 'Orléans': 'fr--Orléans',
  'Angers': 'fr--Angers', 'Brest': 'fr--Brest', 'Limoges': 'fr--Limoges',
  'Amiens': 'fr--Amiens', 'Perpignan': 'fr--Perpignan',
  'La Rochelle': 'fr--La+Rochelle', 'Pau': 'fr--Pau',
  'Clermont-Ferrand': 'fr--Clermont-Ferrand', 'Monaco': 'mc--Monaco',
  'Aix-en-Provence': 'fr--Aix-en-Provence',
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
  if (!dateStr) return new Date().toISOString();
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
      if (parsed.getTime() < now.getTime() - 86400000) {
        return '';
      }
      return parsed.toISOString();
    }
  } catch { /* fallback */ }
  return '';
}

const FOREIGN_KEYWORDS = [
  'genève', 'geneva', 'zürich', 'zurich', 'bern', 'lausanne', 'basel', 'lancy',
  'cumiana', 'torino', 'milano', 'barcelona', 'london', 'bruxelles', 'brussels',
  'deutschland', 'germany', 'schweiz', 'switzerland', 'italia', 'italy', 'españa',
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require service-role bearer (internal call from refresh-events)
  const _serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const _auth = req.headers.get("authorization") || "";
  if (_auth !== `Bearer ${_serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    const slug = CITY_SLUGS[city] || `fr--${city}`;
    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 80;

    const url = `https://www.meetup.com/find/?location=${slug}&source=EVENTS&eventType=inPerson`;
    console.log(`Scraping Meetup for ${city}: ${url}`);

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
          extract: {
            schema: {
              type: 'object',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Event name/title' },
                      group: { type: 'string', description: 'Meetup group name organizing this event' },
                      venue: { type: 'string', description: 'Venue name (e.g. "La Cordée Coworking")' },
                      address: { type: 'string', description: 'Full street address with street number, street name, postal code and city (e.g. "12 Rue de la République, 38000 Grenoble"). Do NOT just put the city name.' },
                      date: { type: 'string', description: 'Event date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss). Use the CURRENT YEAR (2026) unless explicitly stated otherwise.' },
                      price: { type: 'string', description: 'Price or "Gratuit" if free. Most Meetup events are free.' },
                      url: { type: 'string', description: 'Event URL on Meetup' },
                      description: { type: 'string', description: 'Short description or topic of the event' },
                      category: { type: 'string', description: 'Event category: tech, networking, sport, music, language, art, food, outdoor, games, other' },
                      attendees: { type: 'number', description: 'Number of attendees/RSVPs if shown, or null' },
                    },
                    required: ['name'],
                  },
                },
              },
              required: ['events'],
            },
            prompt: `Extract all events listed on this Meetup page. The current date is ${new Date().toISOString().slice(0, 10)}. For dates, use ISO 8601 format with the correct year (2026 for upcoming events). IMPORTANT: For the address field, extract the FULL STREET ADDRESS (street number, street name, postal code, city) — do NOT just write the city name. If you can see a venue name, put it in the venue field separately. Get name, group name, venue, address, date/time, price (most Meetup events are free), URL, description, category (tech/networking/sport/music/language/art/food/outdoor/games/other), and attendees count if displayed.`,
          },
          waitFor: 3000,
          location: { country: 'FR', languages: ['fr'] },
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const extractedData = scrapeData?.data?.extract || scrapeData?.extract || {};
        rawEvents = extractedData?.events || [];
        console.log(`Extracted ${rawEvents.length} raw Meetup events for ${city}`);
      }
    } catch (err) {
      console.error(`Error scraping Meetup for ${city}:`, err);
    }

    const events: any[] = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (!e.name || e.name.length <= 2) continue;

      const addrLower = (e.address || '').toLowerCase();
      const venueLower = (e.venue || '').toLowerCase();
      if (FOREIGN_KEYWORDS.some(kw => addrLower.includes(kw) || venueLower.includes(kw))) {
        console.log(`Rejected foreign: "${e.name}" (${e.address})`);
        continue;
      }

      const startTime = fixEventDate(e.date || '');
      if (!startTime) {
        console.log(`Rejected bad date: "${e.name}" (${e.date})`);
        continue;
      }

      let lat = cityCoords.lat;
      let lng = cityCoords.lng;
      let geocoded = false;

      if (e.address && i < 20) {
        const coords = await geocode(e.address, city);
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
        lat += (Math.random() - 0.5) * 0.015;
        lng += (Math.random() - 0.5) * 0.015;
      }

      const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a');
      const id = `mu-${citySlug}-${i}-${Date.now()}`;

      // Classification Option C
      const { classifyGeneric } = await import('../_shared/classify.ts');
      const cls = classifyGeneric({
        category: e.category,
        name: e.name,
        genres: [],
      });

      events.push({
        id,
        name: e.name,
        venue: e.venue || e.group || '',
        address: e.address || '',
        city,
        lat,
        lng,
        startTime,
        endTime: null,
        description: (e.category ? `[${e.category}] ` : '') + (e.group ? `${e.group} — ` : '') + (e.description || ''),
        ticketUrl: e.url || '',
        price: e.price || 'Gratuit',
        type: cls.type,
        vibe: cls.vibe,
        genres: cls.genres,
        subGenre: cls.subGenre,
        priority: cls.priority,
        category: e.category || 'other',
        externalAttendees: typeof e.attendees === 'number' && e.attendees > 0 ? e.attendees : null,
      });
    }


    console.log(`Returning ${events.length} valid Meetup events for ${city}`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Meetup scrape error:', error);
    return new Response(
      JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
