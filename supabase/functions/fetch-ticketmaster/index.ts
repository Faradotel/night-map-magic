const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, lat, lng, radius = 50 } = await req.json();

    const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ticketmaster API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query params
    const params = new URLSearchParams({
      apikey: apiKey,
      locale: 'fr',
      countryCode: 'FR',
      classificationName: 'music',
      size: '50',
      sort: 'date,asc',
    });

    if (lat && lng) {
      params.set('latlong', `${lat},${lng}`);
      params.set('radius', String(radius));
      params.set('unit', 'km');
    } else if (city) {
      params.set('city', city);
    }

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
    console.log('Fetching Ticketmaster:', url.replace(apiKey, '***'));

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Ticketmaster error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawEvents = data?._embedded?.events || [];
    console.log(`Got ${rawEvents.length} Ticketmaster events`);

    const events = rawEvents.map((e: any) => {
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
