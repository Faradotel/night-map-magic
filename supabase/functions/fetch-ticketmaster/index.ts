// Ticketmaster Discovery API integration

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, lat, lng, radius = 50 } = await req.json();

    const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query params
    const baseParams = new URLSearchParams({
      apikey: apiKey,
      locale: 'fr',
      countryCode: 'FR',
      classificationName: 'music',
      size: '200',
      sort: 'date,asc',
    });

    if (lat && lng) {
      baseParams.set('latlong', `${lat},${lng}`);
      baseParams.set('radius', String(radius));
      baseParams.set('unit', 'km');
    } else if (city) {
      baseParams.set('city', city);
    }

    // Paginate to get all events (max 5 pages = 1000 events)
    const allRawEvents: any[] = [];
    const maxPages = 5;

    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams(baseParams);
      params.set('page', String(page));

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
      if (page === 0) console.log('Fetching Ticketmaster:', url.replace(apiKey, '***'));

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('Ticketmaster error page', page, ':', JSON.stringify(data));
        break;
      }

      const pageEvents = data?._embedded?.events || [];
      allRawEvents.push(...pageEvents);

      const totalPages = data?.page?.totalPages || 1;
      console.log(`Page ${page + 1}/${Math.min(totalPages, maxPages)}: ${pageEvents.length} events`);

      if (page + 1 >= totalPages) break;

      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`Got ${allRawEvents.length} total Ticketmaster events`);

    const events = allRawEvents.map((e: any) => {
      const venue = e._embedded?.venues?.[0];
      const eventLat = parseFloat(venue?.location?.latitude || '0');
      const eventLng = parseFloat(venue?.location?.longitude || '0');
      const priceMin = e.priceRanges?.[0]?.min;
      const genres: string[] = [];
      if (e.classifications?.[0]?.genre?.name && e.classifications[0].genre.name !== 'Undefined') {
        genres.push(e.classifications[0].genre.name.toLowerCase());
      }
      if (e.classifications?.[0]?.subGenre?.name && e.classifications[0].subGenre.name !== 'Undefined') {
        genres.push(e.classifications[0].subGenre.name.toLowerCase());
      }

      return {
        id: `tm-${e.id}`,
        name: e.name,
        venue: venue?.name || '',
        address: venue?.address?.line1 || '',
        city: venue?.city?.name || city || '',
        lat: eventLat,
        lng: eventLng,
        startTime: e.dates?.start?.dateTime || new Date().toISOString(),
        endTime: null,
        description: `${genres.join(', ')} • via Ticketmaster`,
        ticketUrl: e.url || '',
        price: priceMin ? `${priceMin}€` : null,
        genres,
      };
    }).filter((e: any) => e.lat !== 0 && e.lng !== 0);

    console.log(`Returning ${events.length} geocoded Ticketmaster events`);

    return new Response(
      JSON.stringify({ success: true, events }),
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
