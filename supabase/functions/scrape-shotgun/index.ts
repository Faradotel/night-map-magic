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
  genres: string[];
}

// City slug mapping for shotgun.live/fr/cities/{slug}
const CITY_SLUGS: Record<string, string> = {
  'paris': 'paris',
  'lyon': 'lyon',
  'marseille': 'aix-marseille',
  'nice': 'cote-d-azur',
  'bordeaux': 'bordeaux',
  'lille': 'lille',
  'toulouse': 'toulouse',
  'nantes': 'nantes',
  'strasbourg': 'strasbourg',
  'montpellier': 'montpellier',
  'rennes': 'rennes',
  'reims': 'reims',
  'saint-etienne': 'saint-etienne',
  'le havre': 'le-havre',
  'toulon': 'toulon',
  'grenoble': 'grenoble',
  'dijon': 'dijon',
  'angers': 'angers',
  'nimes': 'nimes',
  'clermont-ferrand': 'clermont-ferrand',
  'aix-en-provence': 'aix-marseille',
  'brest': 'brest',
  'tours': 'tours',
  'limoges': 'limoges',
  'amiens': 'amiens',
  'metz': 'metz',
  'rouen': 'rouen',
  'perpignan': 'perpignan',
  'orleans': 'orleans',
  'caen': 'caen',
};

interface ParsedEvent {
  name: string;
  venue: string;
  price: string;
  date: string;
  genres: string[];
  url: string;
}

function parseEventsFromCityPage(markdown: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  const eventRegex = /\[!\[([^\]]*)\]\([^)]*\)\\[\s\\]*([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = eventRegex.exec(markdown)) !== null) {
    const name = match[1].trim();
    const innerContent = match[2];
    const eventUrl = match[3];

    if (!eventUrl.includes('/events/')) continue;
    if (!name) continue;

    const lines = innerContent
      .split('\\')
      .map(l => l.replace(/\n/g, '').replace(/\|/g, '').trim())
      .filter(l => l.length > 0);

    let price = '';
    let venue = '';
    let date = '';
    const genres: string[] = [];

    for (const line of lines) {
      if (line === name) continue;

      if (/[€$]|gratuit|free|waiting list/i.test(line) && !price) {
        price = line;
        continue;
      }

      if (/\b(lun|mar|mer|jeu|ven|sam|dim|jan|fév|mars|avr|mai|juin|juil|août|sep|oct|nov|déc)\b/i.test(line) && !date) {
        date = line;
        continue;
      }

      if (/^\d{1,2}:\d{2}/.test(line)) {
        date = date ? `${date} ${line}` : line;
        continue;
      }

      if (line.length < 40 && !line.includes('[') && !line.includes('(')) {
        if (!venue && line.length > 2 && !/^(techno|house|electro|electronic|pop|rock|rap|hip[\s-]?hop|rnb|r&b|jazz|soul|funk|disco|trance|drum|bass|dnb|dubstep|reggae|dancehall|afro|latin|salsa|reggaeton|edm|club|hard|deep|minimal|ambient|trap|baile|mpb|samba|pagode|afrobeat|afrobeats|indie|folk|metal|punk|alternative|dance|world|classical|blues|swing|tech house|deep house|melodic house|afro house|disco house|hard techno|industrial|psytrance|hardstyle|hardcore|gabber|bass music|drum and bass|drum & bass|singer-songwriter|bossa nova)$/i.test(line)) {
          venue = line;
        } else {
          genres.push(line);
        }
      }
    }

    events.push({
      name,
      venue: venue || name,
      price,
      date,
      genres,
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
    const slug = CITY_SLUGS[cityLower] || cityLower;

    const shotgunUrl = `https://shotgun.live/fr/cities/${slug}`;

    console.log('Scraping Shotgun URL:', shotgunUrl, 'for city:', city);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: shotgunUrl,
        formats: ['markdown'],
        waitFor: 10000,
        timeout: 30000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', JSON.stringify(scrapeData));
      return new Response(
        JSON.stringify({ success: true, events: [], city }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    console.log('Markdown length:', markdown.length);

    const rawEvents = parseEventsFromCityPage(markdown);
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

    // Geocode each venue (limit to 25 events)
    const geocodedEvents: ShotgunEvent[] = [];

    for (const raw of rawEvents.slice(0, 25)) {
      let lat = cityLat + (Math.random() - 0.5) * 0.02;
      let lng = cityLng + (Math.random() - 0.5) * 0.02;

      if (raw.venue && raw.venue !== raw.name) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw.venue + ', ' + city + ', France')}&limit=1`,
            { headers: { 'User-Agent': 'NightMap/1.0' } }
          );
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
          await new Promise(r => setTimeout(r, 200));
        } catch { /* use fallback */ }
      }

      let ticketUrl = raw.url;
      if (ticketUrl && !ticketUrl.startsWith('http')) {
        ticketUrl = `https://shotgun.live${ticketUrl.startsWith('/') ? '' : '/'}${ticketUrl}`;
      }

      const genreStr = raw.genres.length > 0 ? raw.genres.join(', ') : '';
      const description = [genreStr, raw.price, raw.date, 'via Shotgun'].filter(Boolean).join(' • ');

      geocodedEvents.push({
        id: `shotgun-${slug}-${geocodedEvents.length}`,
        name: raw.name,
        venue: raw.venue,
        address: `${raw.venue}, ${city}`,
        city,
        lat,
        lng,
        startTime: new Date().toISOString(),
        description,
        ticketUrl: ticketUrl || `https://shotgun.live/fr/cities/${slug}`,
        price: raw.price || null,
        genres: raw.genres,
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
