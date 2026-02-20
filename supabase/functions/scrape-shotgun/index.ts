const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ShotgunEvent {
  id: string;
  name: string;
  venue: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  startTime: string;
  description: string;
  ticketUrl: string;
  price?: string;
}

// Known Shotgun area IDs for French cities
const AREA_IDS: Record<string, number> = {
  'paris': 1, 'lyon': 4, 'marseille': 5, 'nice': 46,
  'bordeaux': 3, 'lille': 7, 'toulouse': 6, 'nantes': 8,
  'strasbourg': 9, 'montpellier': 10, 'rennes': 11,
};

interface ParsedEvent {
  name: string;
  price: string;
  city: string;
  date: string;
  genre: string;
  url: string;
}

function parseMarkdownEvents(markdown: string, targetCity: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const cityLower = targetCity.toLowerCase();

  // Shotgun markdown format has event blocks like:
  // [![Event Name](image_url)\
  // \
  // Event Name\
  // \
  // Price\
  // \
  // City, Country\
  // \
  // Date\
  // ...
  // Genre](event_url)

  // Split by event links pattern
  const linkRegex = /\[!\[([^\]]*)\]\([^)]*\)[^]*?\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const block = match[0];
    const eventUrl = match[2];
    const altText = match[1]; // event name from alt text

    // Extract lines from the block
    const lines = block.split('\\').map(l => l.replace(/\n/g, '').trim()).filter(l => l && l !== '|');

    // Find event name (appears after the image)
    let name = altText || '';
    let price = '';
    let city = '';
    let date = '';
    let genre = '';

    for (const line of lines) {
      // Skip markdown image syntax and empty lines
      if (line.startsWith('[![') || line.startsWith('](') || line === '') continue;

      // Detect price (contains € or $ or "free"/"gratuit")
      if (/[€$]|gratuit|free/i.test(line) && !price) {
        price = line;
        continue;
      }

      // Detect city/location line (contains country flag or "France")
      if (/🇫🇷|🇺🇸|🇧🇷|🇬🇧|🇩🇪|🇪🇸|🇮🇹|🇧🇪|🇳🇱|🇨🇭|france|états-unis|brésil|belgique/i.test(line)) {
        city = line.replace(/🇫🇷|🇺🇸|🇧🇷|🇬🇧|🇩🇪|🇪🇸|🇮🇹|🇧🇪|🇳🇱|🇨🇭/g, '').trim();
        continue;
      }

      // Detect date (contains day names or month abbreviations)
      if (/\b(lun|mar|mer|jeu|ven|sam|dim|jan|fév|mars|avr|mai|juin|juil|août|sep|oct|nov|déc|mon|tue|wed|thu|fri|sat|sun)\b/i.test(line)) {
        date = line;
        continue;
      }

      // Detect time
      if (/^\|?\d{1,2}:\d{2}/.test(line)) {
        date += ' ' + line.replace('|', '');
        continue;
      }

      // If it's a short word and not matched above, could be genre
      if (line.length < 30 && !line.includes('[') && !line.includes('(')) {
        if (!name || name === altText) {
          // Could be the event name repeated
        }
        genre = genre ? `${genre}, ${line}` : line;
      }
    }

    if (!name) continue;

    // Strict city filter: only include if city line mentions the target city
    if (city) {
      const eventCityLower = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const targetLower = targetCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!eventCityLower.includes(targetLower)) {
        continue;
      }
    }
    // If no city detected at all, skip (can't verify it's in the right city)
    if (!city) continue;

    events.push({
      name: name.trim(),
      price: price || '',
      city: city || targetCity,
      date: date.trim(),
      genre: genre.trim(),
      url: eventUrl,
    });
  }

  return events;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ success: false, error: 'City is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cityLower = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const areaId = AREA_IDS[cityLower];

    // Use areaId if known, otherwise show all events page
    const shotgunUrl = areaId
      ? `https://shotgun.live/fr/events?areaId=${areaId}`
      : `https://shotgun.live/fr/events`;

    console.log('Scraping Shotgun URL:', shotgunUrl, 'for city:', city);

    // Scrape with markdown format (more reliable for JS-rendered pages)
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: shotgunUrl,
        formats: ['markdown'],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', JSON.stringify(scrapeData));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape Shotgun' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    console.log('Markdown length:', markdown.length);

    // Parse events from markdown
    const rawEvents = parseMarkdownEvents(markdown, city);
    console.log(`Parsed ${rawEvents.length} events for ${city}`);

    // Get city center coordinates
    let cityLat = 0, cityLng = 0;
    try {
      const cityGeo = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', France')}&limit=1`,
        { headers: { 'User-Agent': 'NightMap/1.0' } }
      );
      const cityData = await cityGeo.json();
      if (cityData.length > 0) {
        cityLat = parseFloat(cityData[0].lat);
        cityLng = parseFloat(cityData[0].lon);
      }
    } catch (e) {
      console.error('City geocoding failed:', e);
    }

    if (cityLat === 0) {
      return new Response(
        JSON.stringify({ success: true, events: [], city }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Geocode each venue
    const geocodedEvents: ShotgunEvent[] = [];

    for (const raw of rawEvents.slice(0, 15)) {
      let lat = cityLat + (Math.random() - 0.5) * 0.008;
      let lng = cityLng + (Math.random() - 0.5) * 0.008;

      if (raw.name) {
        // Try geocoding venue name
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw.name + ', ' + city + ', France')}&limit=1`,
            { headers: { 'User-Agent': 'NightMap/1.0' } }
          );
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
          await new Promise(r => setTimeout(r, 250));
        } catch { /* use fallback */ }
      }

      let ticketUrl = raw.url;
      if (ticketUrl && !ticketUrl.startsWith('http')) {
        ticketUrl = `https://shotgun.live${ticketUrl.startsWith('/') ? '' : '/'}${ticketUrl}`;
      }

      geocodedEvents.push({
        id: `shotgun-${cityLower}-${geocodedEvents.length}`,
        name: raw.name,
        venue: raw.name,
        address: raw.city || city,
        city,
        lat,
        lng,
        startTime: new Date().toISOString(),
        description: [raw.genre, raw.price, 'via Shotgun'].filter(Boolean).join(' • '),
        ticketUrl: ticketUrl || `https://shotgun.live/fr/events?areaId=${areaId || ''}`,
        price: raw.price || null,
      });
    }

    console.log(`Returning ${geocodedEvents.length} geocoded Shotgun events`);

    return new Response(
      JSON.stringify({ success: true, events: geocodedEvents, city }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
