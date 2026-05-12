// Scrape Eventbrite listings for a city using Firecrawl
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  'Paris': 'paris', 'Marseille': 'marseille', 'Lyon': 'lyon', 'Toulouse': 'toulouse',
  'Nice': 'nice', 'Nantes': 'nantes', 'Montpellier': 'montpellier', 'Strasbourg': 'strasbourg',
  'Bordeaux': 'bordeaux', 'Lille': 'lille', 'Rennes': 'rennes', 'Reims': 'reims',
  'Grenoble': 'grenoble', 'Dijon': 'dijon', 'Tours': 'tours', 'Rouen': 'rouen',
  'Metz': 'metz', 'Nancy': 'nancy', 'Avignon': 'avignon', 'Poitiers': 'poitiers',
  'Besançon': 'besancon', 'Caen': 'caen', 'Orléans': 'orleans', 'Angers': 'angers',
  'Brest': 'brest', 'Limoges': 'limoges', 'Amiens': 'amiens', 'Perpignan': 'perpignan',
  'La Rochelle': 'la-rochelle', 'Pau': 'pau', 'Clermont-Ferrand': 'clermont-ferrand',
  'Monaco': 'monaco', 'Aix-en-Provence': 'aix-en-provence',
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

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode an address using Nominatim, scoped to France — single attempt
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

// Try to fix the year in extracted dates: Eventbrite scraper often returns wrong years
function fixEventDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();

  try {
    let parsed = new Date(dateStr);

    // If the date is in the past (before today minus 1 day), it's likely a wrong year
    if (!isNaN(parsed.getTime())) {
      const now = new Date();
      // If the year is clearly wrong (before current year), try replacing with current year
      if (parsed.getFullYear() < now.getFullYear()) {
        const fixed = new Date(parsed);
        fixed.setFullYear(now.getFullYear());
        // If still in the past, try next year
        if (fixed.getTime() < now.getTime() - 86400000) {
          fixed.setFullYear(now.getFullYear() + 1);
        }
        return fixed.toISOString();
      }
      // If date is more than 1 day in the past, skip it
      if (parsed.getTime() < now.getTime() - 86400000) {
        return ''; // Will be filtered out
      }
      return parsed.toISOString();
    }
  } catch { /* fallback below */ }

  return '';
}

// Reject foreign addresses
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

    const slug = CITY_SLUGS[city] || city.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a');
    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };
    const MAX_DISTANCE_KM = 80;

    const url = `https://www.eventbrite.fr/d/france--${slug}/events/`;
    console.log(`Scraping Eventbrite for ${city}: ${url}`);

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
                      venue: { type: 'string', description: 'Venue name (e.g. "Salle Olivier Messiaen", "La Belle Electrique")' },
                      address: { type: 'string', description: 'Full street address with street number, street name, postal code and city (e.g. "12 Rue de la République, 38000 Grenoble"). Do NOT just put the city name.' },
                      date: { type: 'string', description: 'Event date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss). Use the CURRENT YEAR (2026) unless explicitly stated otherwise.' },
                      price: { type: 'string', description: 'Price or "Gratuit" if free' },
                      url: { type: 'string', description: 'Event URL on Eventbrite' },
                      description: { type: 'string', description: 'Short description or category/genre tags' },
                      category: { type: 'string', description: 'Event category: music, sport, theatre, expo, festival, spectacle, or other' },
                      attendees: { type: 'number', description: 'Number of people going/interested if shown on the page, or null' },
                    },
                    required: ['name'],
                  },
                },
              },
              required: ['events'],
            },
            prompt: `Extract all events listed on this page. The current date is ${new Date().toISOString().slice(0, 10)}. For dates, use ISO 8601 format with the correct year (2026 for upcoming events). IMPORTANT: For the address field, extract the FULL STREET ADDRESS (street number, street name, postal code, city) — do NOT just write the city name. If you can see a venue name, put it in the venue field separately. Get name, venue, address, date/time, price, URL, description, category (music/sport/theatre/expo/festival/spectacle/other), and attendees count if displayed.`,
          },
          waitFor: 3000,
          location: { country: 'FR', languages: ['fr'] },
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const extractedData = scrapeData?.data?.extract || scrapeData?.extract || {};
        rawEvents = extractedData?.events || [];
        console.log(`Extracted ${rawEvents.length} raw events for ${city}`);
      }
    } catch (err) {
      console.error(`Error scraping for ${city}:`, err);
    }

    // Process events: geocode, validate dates, filter foreign
    const events: any[] = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      if (!e.name || e.name.length <= 2) continue;

      // Check for foreign addresses
      const addrLower = (e.address || '').toLowerCase();
      const venueLower = (e.venue || '').toLowerCase();
      if (FOREIGN_KEYWORDS.some(kw => addrLower.includes(kw) || venueLower.includes(kw))) {
        console.log(`Rejected foreign: "${e.name}" (${e.address})`);
        continue;
      }

      // Check if address mentions a different city
      const addrClean = (e.address || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const targetLower = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const KNOWN_OTHER_CITIES = ['lyon','annecy','chambery','villeurbanne','valence','saint-etienne','geneve','geneva','lausanne','zurich','turin','milano','barcelona','bruxelles','crest','voiron','vienne','bourgoin','albertville','gap','romans'];
      const mentionsOther = KNOWN_OTHER_CITIES.filter(c => c !== targetLower).find(c => {
        // Match city name as a word anywhere in the address
        const re = new RegExp(`\\b${c}\\b`);
        return re.test(addrClean);
      });
      if (mentionsOther) {
        console.log(`Rejected wrong city: "${e.name}" (${e.address})`);
        continue;
      }

      // Fix date
      const startTime = fixEventDate(e.date || '');
      if (!startTime) {
        console.log(`Rejected bad date: "${e.name}" (${e.date})`);
        continue;
      }

      // Geocode (limit to first 15 to stay within timeout)
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

      // Add small random offset if at exact city center (not geocoded)
      if (!geocoded) {
        lat += (Math.random() - 0.5) * 0.015;
        lng += (Math.random() - 0.5) * 0.015;
      }

      const id = `eb-${slug}-${i}-${Date.now()}`;

      events.push({
        id,
        name: e.name,
        venue: e.venue || '',
        address: e.address || '',
        city,
        lat,
        lng,
        startTime,
        endTime: null,
        description: (e.category ? `[${e.category}] ` : '') + (e.description || ''),
        ticketUrl: e.url || '',
        price: e.price || null,
        genres: [] as string[],
        category: e.category || 'other',
        externalAttendees: typeof e.attendees === 'number' && e.attendees > 0 ? e.attendees : null,
      });
    }

    console.log(`Returning ${events.length} valid Eventbrite events for ${city}`);

    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Eventbrite scrape error:', error);
    return new Response(
      JSON.stringify({ success: true, events: [] }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
