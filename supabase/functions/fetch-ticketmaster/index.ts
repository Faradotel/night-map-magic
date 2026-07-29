// Ticketmaster Discovery API integration

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: accept service-role bearer (internal) OR a valid user JWT
  {
    const _serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const _auth = req.headers.get("authorization") || "";
    let _ok = _auth === `Bearer ${_serviceKey}`;
    if (!_ok && _auth.startsWith("Bearer ")) {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
        const { data, error } = await _sb.auth.getClaims(_auth.replace("Bearer ", ""));
        _ok = !error && !!data?.claims?.sub;
      } catch { _ok = false; }
    }
    if (!_ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  try {
    const { city, lat, lng, radius = 80 } = await req.json();

    // Validate & cap inputs to prevent API quota abuse
    const safeRadius = Math.min(Math.max(Number(radius) || 80, 1), 150);
    const latNum = lat !== undefined ? Number(lat) : undefined;
    const lngNum = lng !== undefined ? Number(lng) : undefined;
    const hasCoords =
      Number.isFinite(latNum) && Number.isFinite(lngNum) &&
      (latNum as number) >= 41 && (latNum as number) <= 51 &&
      (lngNum as number) >= -5 && (lngNum as number) <= 10;

    const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query params
    // Note: on retire `classificationName: 'music'` — trop restrictif, exclut
    // pas mal de concerts mal classés + spectacles/humour/festivals. On filtre
    // en aval si besoin. On borne la fenêtre à [now, now+90j] pour ne pas
    // saturer le cap dur Ticketmaster de 1000 résultats/requête sur les
    // grandes villes (Paris/Lyon/…) et rester dans un horizon utile pour
    // "sortir prochainement".
    const isoNoMs = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const baseParams = new URLSearchParams({
      apikey: apiKey,
      locale: 'fr',
      countryCode: 'FR',
      size: '200',
      sort: 'date,asc',
      startDateTime: isoNoMs(new Date(Date.now() - 3600_000)),
      endDateTime: isoNoMs(new Date(Date.now() + 90 * 24 * 3600_000)),
    });

    if (hasCoords) {
      baseParams.set('latlong', `${latNum},${lngNum}`);
      baseParams.set('radius', String(safeRadius));
      baseParams.set('unit', 'km');
    } else if (typeof city === 'string' && city.length > 0 && city.length <= 80) {
      baseParams.set('city', city);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid location parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Classification propre: segment/genre/subGenre TM → type/vibe/genres/subGenre/priority Pulse
    const { classifyTicketmaster } = await import('../_shared/classify.ts');

    const events = allRawEvents.map((e: any) => {
      const venue = e._embedded?.venues?.[0];
      const eventLat = parseFloat(venue?.location?.latitude || '0');
      const eventLng = parseFloat(venue?.location?.longitude || '0');
      const priceMin = e.priceRanges?.[0]?.min;
      const cls = e.classifications?.[0] || {};
      const segmentName = cls.segment?.name;
      const genreName = cls.genre?.name;
      const subGenreName = cls.subGenre?.name;

      const classified = classifyTicketmaster({
        segment: segmentName,
        genre: genreName,
        subGenre: subGenreName,
        name: e.name,
      });

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
        description: `${classified.genres.join(', ')} • via Ticketmaster`,
        ticketUrl: e.url || '',
        price: priceMin ? `${priceMin}€` : null,
        type: classified.type,
        vibe: classified.vibe,
        genres: classified.genres,
        subGenre: classified.subGenre,
        priority: classified.priority,
      };
    }).filter((e: any) => e.lat !== 0 && e.lng !== 0);

    console.log(`Returning ${events.length} geocoded Ticketmaster events`);


    return new Response(
      JSON.stringify({ success: true, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ticketmaster fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch events. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
