// Scrape Eventbrite listings for a city using Firecrawl
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
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
  'Paris': 'paris',
  'Marseille': 'marseille',
  'Lyon': 'lyon',
  'Toulouse': 'toulouse',
  'Nice': 'nice',
  'Nantes': 'nantes',
  'Montpellier': 'montpellier',
  'Strasbourg': 'strasbourg',
  'Bordeaux': 'bordeaux',
  'Lille': 'lille',
  'Rennes': 'rennes',
  'Reims': 'reims',
  'Grenoble': 'grenoble',
  'Dijon': 'dijon',
  'Tours': 'tours',
  'Rouen': 'rouen',
  'Metz': 'metz',
  'Nancy': 'nancy',
  'Avignon': 'avignon',
  'Poitiers': 'poitiers',
  'Besançon': 'besancon',
  'Caen': 'caen',
  'Orléans': 'orleans',
  'Angers': 'angers',
  'Brest': 'brest',
  'Limoges': 'limoges',
  'Amiens': 'amiens',
  'Perpignan': 'perpignan',
  'La Rochelle': 'la-rochelle',
  'Pau': 'pau',
  'Clermont-Ferrand': 'clermont-ferrand',
  'Monaco': 'monaco',
};

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

    const slug = CITY_SLUGS[city] || city.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a');
    
    // Scrape only one broad category to stay within timeout
    const categories = [
      { path: 'events--this-week/', label: 'all' },
    ];

    const allRawEvents: any[] = [];

    for (const cat of categories) {
      const url = `https://www.eventbrite.fr/d/france--${slug}/${cat.path}`;
      console.log(`Scraping Eventbrite ${cat.label} for ${city}: ${url}`);

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
                        venue: { type: 'string', description: 'Venue name' },
                        address: { type: 'string', description: 'Full address including city' },
                        date: { type: 'string', description: 'Event date and time as ISO string or readable format' },
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
              prompt: 'Extract all events listed on this page. For each event, get the name, venue, address, date/time, price, URL, description, category (music, sport, theatre, expo, festival, spectacle, or other), and the number of attendees/interested people if displayed.',
            },
            waitFor: 3000,
            location: { country: 'FR', languages: ['fr'] },
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const extractedData = scrapeData?.data?.extract || scrapeData?.extract || {};
          const rawEvents = extractedData?.events || [];
          for (const e of rawEvents) {
            e._category = cat.label;
          }
          allRawEvents.push(...rawEvents);
          console.log(`Got ${rawEvents.length} ${cat.label} events for ${city}`);
        }
      } catch (err) {
        console.error(`Error scraping ${cat.label} for ${city}:`, err);
      }
    }

    const rawEvents = allRawEvents;
    console.log(`Total extracted ${rawEvents.length} Eventbrite events for ${city}`);

    // We need to geocode these events — use the city center as fallback
    const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Marseille': { lat: 43.2965, lng: 5.3698 },
      'Lyon': { lat: 45.7640, lng: 4.8357 },
      'Toulouse': { lat: 43.6047, lng: 1.4442 },
      'Nice': { lat: 43.7102, lng: 7.2620 },
      'Nantes': { lat: 47.2184, lng: -1.5536 },
      'Montpellier': { lat: 43.6108, lng: 3.8767 },
      'Strasbourg': { lat: 48.5734, lng: 7.7521 },
      'Bordeaux': { lat: 44.8378, lng: -0.5792 },
      'Lille': { lat: 50.6292, lng: 3.0573 },
      'Rennes': { lat: 48.1173, lng: -1.6778 },
      'Grenoble': { lat: 45.1885, lng: 5.7245 },
      'Dijon': { lat: 47.3220, lng: 5.0415 },
      'Monaco': { lat: 43.7384, lng: 7.4246 },
    };

    const cityCoords = CITY_COORDS[city] || { lat: 48.8566, lng: 2.3522 };

    // Try geocoding each event address, fallback to city center with small random offset
    const events = await Promise.all(
      rawEvents.map(async (e: any, i: number) => {
        let lat = cityCoords.lat;
        let lng = cityCoords.lng;

        // Try geocoding with Nominatim (rate-limited, so only first 20)
        if (e.address && i < 20) {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(e.address + ', ' + city + ', France')}&limit=1`,
              { headers: { 'User-Agent': 'PulseMap/1.0' } }
            );
            const geoData = await geoRes.json();
            if (geoData?.[0]) {
              lat = parseFloat(geoData[0].lat);
              lng = parseFloat(geoData[0].lon);
            }
            // Small delay to respect Nominatim rate limits
            await new Promise(r => setTimeout(r, 200));
          } catch { /* use fallback coords */ }
        }

        // Add small random offset if still at exact city center
        if (lat === cityCoords.lat && lng === cityCoords.lng) {
          lat += (Math.random() - 0.5) * 0.02;
          lng += (Math.random() - 0.5) * 0.02;
        }

        // Parse date
        let startTime = new Date().toISOString();
        if (e.date) {
          try {
            const parsed = new Date(e.date);
            if (!isNaN(parsed.getTime())) startTime = parsed.toISOString();
          } catch { /* keep default */ }
        }

        const id = `eb-${slug}-${i}-${Date.now()}`;

        return {
          id,
          name: e.name || '',
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
          category: e.category || e._category || 'other',
          externalAttendees: typeof e.attendees === 'number' && e.attendees > 0 ? e.attendees : null,
        };
      })
    );

    const validEvents = events.filter((e: any) => e.name && e.name.length > 2);
    console.log(`Returning ${validEvents.length} valid Eventbrite events for ${city}`);

    return new Response(
      JSON.stringify({ success: true, events: validEvents }),
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
