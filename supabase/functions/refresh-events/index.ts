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

const CITIES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier',
  'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne',
  'Le Havre', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes',
  'Clermont-Ferrand', 'Aix-en-Provence', 'Brest', 'Tours', 'Limoges',
  'Amiens', 'Metz', 'Rouen', 'Perpignan', 'Orléans', 'Caen', 'Mulhouse',
  'Nancy', 'Saint-Denis (Réunion)', 'Argenteuil', 'Montreuil', 'Roubaix',
  'Tourcoing', 'Dunkerque', 'Avignon', 'Nanterre', 'Poitiers', 'Versailles',
  'Courbevoie', 'Vitry-sur-Seine', 'Créteil', 'Pau', 'Colombes',
  'La Rochelle', 'Besançon', 'Valence', 'Monaco',
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Require service-role bearer token OR a shared refresh secret (cron / trusted server only)
    const authHeader = req.headers.get('authorization') || '';
    const refreshSecret = Deno.env.get('REFRESH_EVENTS_SECRET') || '';
    const providedSecret = req.headers.get('x-refresh-secret') || '';
    const okBearer = authHeader === `Bearer ${supabaseKey}`;
    const okSecret = refreshSecret !== '' && providedSecret === refreshSecret;
    if (!okBearer && !okSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = supabaseKey; // internal scraper calls authenticate via service role

    // Accept optional "city" param to refresh a single city
    let citiesToRefresh = CITIES;
    let singleCity = false;
    try {
      const body = await req.json();
      if (body?.city) {
        citiesToRefresh = [body.city];
        singleCity = true;
      }
    } catch { /* no body = refresh all */ }

    console.log(`Refreshing ${citiesToRefresh.length} cities...`);

    // Clean up truly past events (where both start_time and end_time are in the past)
    const { error: cleanupError } = await supabase
      .from('cached_events')
      .delete()
      .lt('start_time', new Date().toISOString())
      .or(`end_time.is.null,end_time.lt.${new Date().toISOString()}`);
    if (cleanupError) {
      console.error('Error cleaning up past events:', cleanupError.message);
    } else {
      console.log('Cleaned up past events');
    }

    // Clean up brocabrac events with invalid city names (parsing artifacts)
    const INVALID_CITIES = ['Img', 'Text', 'Evenements', 'Menu', 'Accueil', 'Connexion'];
    const { error: junkError } = await supabase
      .from('cached_events')
      .delete()
      .eq('source', 'brocabrac')
      .in('city', INVALID_CITIES);
    if (junkError) console.error('Error cleaning junk cities:', junkError.message);
    else console.log('Cleaned up invalid brocabrac city names');

    // Fix misclassified brocabrac events (expo/chill → brocante/culture)
    const { error: bbFixError } = await supabase
      .from('cached_events')
      .update({ type: 'brocante', vibe: 'culture' })
      .eq('source', 'brocabrac')
      .in('type', ['expo', 'soirée', 'concert'])
      .not('type', 'eq', 'sport');
    if (bbFixError) console.error('Error fixing brocabrac types:', bbFixError.message);
    else console.log('Fixed brocabrac event categories');

    // Fix misclassified runtrail events
    const { error: rtFixError } = await supabase
      .from('cached_events')
      .update({ type: 'sport', vibe: 'sport' })
      .eq('source', 'runtrail')
      .neq('type', 'sport');
    if (rtFixError) console.error('Error fixing runtrail types:', rtFixError.message);
    else console.log('Fixed runtrail event categories');

    let totalInserted = 0;

    function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> {
      return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        ),
      ]);
    }

    const SPORT_KEYWORDS = /football|rugby|tennis|basket|volley|vélo|velo|cyclisme|athlétisme|natation|ski|pétanque|handball|judo|karaté|escrime|tir|course|trail|run|sport|gym|fitness|escalade|équitation|equitation|pucier/i;

    // Curated venue → coords overrides (applied across ALL sources to fix bad/centroid coords).
    // Match by normalized substring of either `venue` or `address`.
    const VENUE_OVERRIDES: Array<{ match: string; lat: number; lng: number }> = [
      // Grenoble
      { match: 'jardin de la ville de grenoble', lat: 45.1922202, lng: 5.7266400 },
      { match: 'belle electrique', lat: 45.1871714, lng: 5.7041520 },
      { match: 'palais des sports', lat: 45.1856594, lng: 5.7407455 },
      { match: 'alpexpo', lat: 45.1553320, lng: 5.7363426 },
      { match: 'alpes congres', lat: 45.1561279, lng: 5.7342690 },
      { match: 'summum', lat: 45.1553643, lng: 5.7372962 },
      { match: 'mc2', lat: 45.1722309, lng: 5.7337104 },
      { match: 'le ciel', lat: 45.1894474, lng: 5.7314408 },
      { match: 'amperage', lat: 45.1885466, lng: 5.7031337 },
      { match: 'adaep', lat: 45.1885466, lng: 5.7031337 },
      { match: 'auditorium du musee de grenoble', lat: 45.1947121, lng: 5.7329445 },
      { match: 'auditorium du musée de grenoble', lat: 45.1947121, lng: 5.7329445 },
      { match: 'musee de grenoble', lat: 45.1957700, lng: 5.7314200 },
      { match: 'musee dauphinois', lat: 45.1954300, lng: 5.7220500 },
      { match: 'la source', lat: 45.1483000, lng: 5.7508000 },
      { match: 'cafe des arts', lat: 45.1961170, lng: 5.7300422 },
      { match: 'café des arts', lat: 45.1961170, lng: 5.7300422 },
      { match: 'premol', lat: 45.1633335, lng: 5.7276079 },
      { match: 'prémol', lat: 45.1633335, lng: 5.7276079 },
      // Paris national venues
      { match: 'accor arena', lat: 48.8386, lng: 2.3789 },
      { match: 'bercy', lat: 48.8386, lng: 2.3789 },
      { match: 'olympia', lat: 48.8702, lng: 2.3286 },
      { match: 'zénith de paris', lat: 48.8946, lng: 2.3933 },
      { match: 'zenith de paris', lat: 48.8946, lng: 2.3933 },
      { match: 'stade de france', lat: 48.9244, lng: 2.3601 },
      { match: 'la défense arena', lat: 48.8956, lng: 2.2294 },
      { match: 'la defense arena', lat: 48.8956, lng: 2.2294 },
      // Nice
      { match: 'palais nikaia', lat: 43.6614, lng: 7.1989 },
      { match: 'palais nikaïa', lat: 43.6614, lng: 7.1989 },
      { match: 'nikaia', lat: 43.6614, lng: 7.1989 },
      { match: 'allianz riviera', lat: 43.7050, lng: 7.1925 },
      { match: 'stade allianz', lat: 43.7050, lng: 7.1925 },
    ];

    function normalizeForMatch(s: string): string {
      return (s || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function applyVenueOverride(venue: string, address: string): { lat: number; lng: number } | null {
      const haystack = `${normalizeForMatch(venue)} ${normalizeForMatch(address)}`;
      for (const o of VENUE_OVERRIDES) {
        if (haystack.includes(o.match)) return { lat: o.lat, lng: o.lng };
      }
      return null;
    }


    function getTypeVibe(e: any): { type: string; vibe: string } {
      const id: string = e.id || '';
      const name: string = e.name || '';
      if (id.startsWith('rt-')) return { type: 'sport', vibe: 'sport' };
      if (id.startsWith('sf-')) return { type: 'sport', vibe: 'sport' };
      if (id.startsWith('rdf-')) return { type: 'festival', vibe: 'concert' };
      if (id.startsWith('icf-')) return { type: 'festival', vibe: 'concert' };
      if (id.startsWith('oa-')) {
        // Use oaType from scraper if available, fallback to spectacle
        const oaType = e.oaType || 'spectacle';
        const vibeMap: Record<string, string> = { concert: 'concert', sport: 'sport', expo: 'chill', afterwork: 'afterwork' };
        return { type: oaType, vibe: vibeMap[oaType] || 'culture' };
      }
      if (id.startsWith('bb-')) {
        if (SPORT_KEYWORDS.test(name)) return { type: 'sport', vibe: 'sport' };
        return { type: 'brocante', vibe: 'culture' };
      }
      if (id.startsWith('mu-')) return { type: 'afterwork', vibe: 'afterwork' };
      return { type: 'concert', vibe: 'concert' };
    }

    async function processCity(city: string): Promise<number> {
      // Capture timestamp BEFORE scraping — used to delete stale events after upsert
      const refreshStart = new Date().toISOString();

      // Skip city if refreshed within the last 4 minutes (prevents double-refresh race)
      if (citiesToRefresh.length > 1) {
        const { data: recentCheck } = await supabase
          .from('cached_events')
          .select('updated_at')
          .eq('city', city)
          .limit(1)
          .maybeSingle();
        if (recentCheck?.updated_at) {
          const ageMs = Date.now() - new Date(recentCheck.updated_at).getTime();
          if (ageMs < 4 * 60 * 1000) {
            console.log(`${city}: skipped (refreshed ${Math.round(ageMs / 1000)}s ago)`);
            return 0;
          }
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      };
      const body = JSON.stringify({ city });

      const [shotgunRes, tmRes, ebRes, muRes, icRes, rdfRes, bbRes, rtRes, oaRes, sfRes] = await Promise.allSettled([
        fetchWithTimeout(`${supabaseUrl}/functions/v1/scrape-shotgun`, { method: 'POST', headers, body }).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-ticketmaster`, { method: 'POST', headers, body }).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-eventbrite`, { method: 'POST', headers, body }).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-meetup`, { method: 'POST', headers, body }).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-infoconcert`, { method: 'POST', headers, body }, 55000).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-routedesfestivals`, { method: 'POST', headers, body }, 50000).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-brocabrac`, { method: 'POST', headers, body }, 45000).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-runtrail`, { method: 'POST', headers, body }).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-openagenda`, { method: 'POST', headers, body }).then(r => r.json()),
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-sports-federations`, { method: 'POST', headers, body }, 55000).then(r => r.json()),
      ]);

      const events: any[] = [];
      if (shotgunRes.status === 'fulfilled' && shotgunRes.value?.events) events.push(...shotgunRes.value.events);
      if (tmRes.status === 'fulfilled' && tmRes.value?.events) events.push(...tmRes.value.events);
      if (ebRes.status === 'fulfilled' && ebRes.value?.events) events.push(...ebRes.value.events);
      if (muRes.status === 'fulfilled' && muRes.value?.events) events.push(...muRes.value.events);
      if (icRes.status === 'fulfilled' && icRes.value?.events) events.push(...icRes.value.events);
      if (rdfRes.status === 'fulfilled' && rdfRes.value?.events) events.push(...rdfRes.value.events);
      if (bbRes.status === 'fulfilled' && bbRes.value?.events) events.push(...bbRes.value.events);
      if (rtRes.status === 'fulfilled' && rtRes.value?.events) events.push(...rtRes.value.events);
      if (oaRes.status === 'fulfilled' && oaRes.value?.events) events.push(...oaRes.value.events);
      if (sfRes.status === 'fulfilled' && sfRes.value?.events) events.push(...sfRes.value.events);


      if (events.length === 0) return 0;

      const batch = events.map((e: any) => {
        const { type, vibe } = getTypeVibe(e);
        const override = applyVenueOverride(e.venue || '', e.address || '');
        return {
          id: e.id,
          name: e.name || '',
          type,
          vibe,
          genres: e.genres || [],
          lat: override?.lat ?? e.lat ?? 0,
          lng: override?.lng ?? e.lng ?? 0,
          address: e.address || '',
          city: (e.city || city).replace(/\s*\(\d+\)\s*$/, '').trim(),
          start_time: e.startTime || new Date().toISOString(),
          end_time: e.endTime || null,
          price_range: e.price || '€10-20',
          description: e.description || '',
          venue: e.venue || '',
          ticket_url: e.ticketUrl || null,
          source: e.id?.startsWith('eb-') ? 'eventbrite' : e.id?.startsWith('tm-') ? 'ticketmaster' : e.id?.startsWith('mu-') ? 'meetup' : e.id?.startsWith('icf-') ? 'infoconcert' : e.id?.startsWith('ic-') ? 'infoconcert' : e.id?.startsWith('rdf-') ? 'routedesfestivals' : e.id?.startsWith('bb-') ? 'brocabrac' : e.id?.startsWith('rt-') ? 'runtrail' : e.id?.startsWith('sf-') ? 'sports-federations' : e.id?.startsWith('oa-') ? 'openagenda' : 'shotgun',
          updated_at: new Date().toISOString(),
          external_attendees: e.externalAttendees || null,
        };
      });

      // 1. Upsert new events FIRST — users always see data, no gap
      const { error } = await supabase.from('cached_events').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Error inserting ${city}:`, error.message);
        return 0;
      }

      // 2. Remove stale events from previous refreshes (updated_at predates this run)
      await supabase.from('cached_events')
        .delete()
        .eq('city', city)
        .lt('updated_at', refreshStart);

      console.log(`${city}: ${batch.length} events cached`);
      return batch.length;
    }

    // Curated events that 3rd-party scrapers miss/get wrong — always upserted.
    const CURATED_EVENTS: any[] = [
      {
        id: 'curated-magic-bus-2026',
        name: 'Festival Magic Bus 2026',
        type: 'festival',
        vibe: 'concert',
        genres: ['rock', 'electro', 'musique'],
        lat: 45.1856594,
        lng: 5.7407455,
        address: 'Palais des Sports, Grenoble',
        city: 'Grenoble',
        start_time: '2026-05-29T18:00:00+02:00',
        end_time: '2026-05-31T01:00:00+02:00',
        price_range: '€',
        description: "25e édition du festival Magic Bus au Palais des Sports de Grenoble — 2 jours de concerts et de fête. • via Route des Festivals",
        venue: 'Palais des Sports',
        ticket_url: 'https://www.seetickets.com/fr/d/event/festival-magic-bus-2026-pass-2-jours-ven-sam/palais-des-sports-de-grenoble/11587107',
        source: 'routedesfestivals',
        external_attendees: null,
      },
    ];

    // Process cities in parallel batches of 3 (~3x faster than sequential)
    const BATCH_SIZE = 3;
    for (let i = 0; i < citiesToRefresh.length; i += BATCH_SIZE) {
      const cityBatch = citiesToRefresh.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(cityBatch.map(processCity));
      for (const r of results) {
        if (r.status === 'fulfilled') totalInserted += r.value;
      }
    }

    // Upsert curated AFTER city refresh so the stale-events cleanup doesn't drop them
    const curatedForCities = CURATED_EVENTS
      .filter(e => citiesToRefresh.length > 5 || citiesToRefresh.includes(e.city))
      .map(e => ({ ...e, updated_at: new Date().toISOString() }));
    if (curatedForCities.length > 0) {
      const { error: curatedErr } = await supabase
        .from('cached_events')
        .upsert(curatedForCities, { onConflict: 'id' });
      if (curatedErr) console.error('Curated upsert error:', curatedErr.message);
      else console.log(`Curated: ${curatedForCities.length} events upserted`);
    }

    // ── Brocabrac: scrape ALL French departments not already covered by city loop ──
    const CITY_TO_DEPT: Record<string, string> = {
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
    };

    const coveredDepts = new Set(citiesToRefresh.map(c => CITY_TO_DEPT[c]).filter(Boolean));
    const ALL_DEPTS = [
      '01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19',
      '21','22','23','24','25','26','27','28','29','2A','2B',
      '30','31','32','33','34','35','36','37','38','39',
      '40','41','42','43','44','45','46','47','48','49',
      '50','51','52','53','54','55','56','57','58','59',
      '60','61','62','63','64','65','66','67','68','69',
      '70','71','72','73','74','75','76','77','78','79',
      '80','81','82','83','84','85','86','87','88','89',
      '90','91','92','93','94','95',
    ];
    const missingDepts = singleCity ? [] : ALL_DEPTS.filter(d => !coveredDepts.has(d));
    console.log(`Brocabrac extra: scraping ${missingDepts.length} uncovered departments...`);

    const BB_BATCH = 5;
    for (let i = 0; i < missingDepts.length; i += BB_BATCH) {
      const deptBatch = missingDepts.slice(i, i + BB_BATCH);
      const bbResults = await Promise.allSettled(deptBatch.map(async (dept) => {
        try {
          const res = await fetchWithTimeout(
            `${supabaseUrl}/functions/v1/fetch-brocabrac`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
              body: JSON.stringify({ dept }) },
            45000
          );
          const data = await res.json();
          const events = data?.events || [];
          if (events.length === 0) return 0;

          const batch = events.map((e: any, idx: number) => {
            const eName = e.name || '';
            const isSport = SPORT_KEYWORDS.test(eName);
            return {
            id: e.id || `bb-${dept}-${idx}-${Date.now()}`,
            name: eName,
            type: isSport ? 'sport' : 'brocante',
            vibe: isSport ? 'sport' : 'culture',
            genres: e.genres || [],
            lat: e.lat || 0,
            lng: e.lng || 0,
            address: e.address || '',
            city: (e.city || '').replace(/\s*\(\d+\)\s*$/, '').trim(),
            start_time: e.startTime || new Date().toISOString(),
            end_time: e.endTime || null,
            price_range: e.price || 'Gratuit',
            description: e.description || '',
            venue: e.venue || '',
            ticket_url: e.ticketUrl || null,
            source: 'brocabrac',
            updated_at: new Date().toISOString(),
            external_attendees: null,
          }});

          const { error } = await supabase.from('cached_events').upsert(batch, { onConflict: 'id' });
          if (error) { console.error(`BB dept ${dept}:`, error.message); return 0; }
          console.log(`BB dept ${dept}: ${batch.length} events`);
          return batch.length;
        } catch (err) {
          console.error(`BB dept ${dept} failed:`, err);
          return 0;
        }
      }));
      for (const r of bbResults) {
        if (r.status === 'fulfilled') totalInserted += r.value;
      }
    }

    // ── InfoConcert Festivals: bulk scrape (1 call, all cities) ──
    try {
      console.log('[ICF] Bulk scraping InfoConcert festivals...');
      const icfRes = await fetchWithTimeout(
        `${supabaseUrl}/functions/v1/fetch-infoconcert-festivals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
          body: JSON.stringify(singleCity ? { city: citiesToRefresh[0] } : {}),
        },
        180000
      );
      const icfData = await icfRes.json();
      const rawByCity: Record<string, any[]> = icfData?.byCity || {};
      const byCity: Record<string, any[]> = singleCity
        ? Object.fromEntries(Object.entries(rawByCity).filter(([c]) => citiesToRefresh.includes(c)))
        : rawByCity;
      const cityNames = Object.keys(byCity);
      if (cityNames.length > 0) {
        const normName = (s: string) => (s || '').toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

        // Fetch existing RDF festivals across the same cities in one query
        const { data: existingRdf } = await supabase
          .from('cached_events')
          .select('name, city, start_time')
          .eq('source', 'routedesfestivals')
          .in('city', cityNames);

        const rdfByCity = new Map<string, { n: string; ts: number }[]>();
        for (const r of existingRdf || []) {
          const arr = rdfByCity.get(r.city) || [];
          arr.push({ n: normName(r.name), ts: new Date(r.start_time).getTime() });
          rdfByCity.set(r.city, arr);
        }

        const allIcfBatch: any[] = [];
        for (const [city, evs] of Object.entries(byCity)) {
          const rdfList = rdfByCity.get(city) || [];
          for (const e of evs) {
            const en = normName(e.name);
            const ets = new Date(e.startTime).getTime();
            const dup = rdfList.some(r =>
              (r.n === en || (r.n.length > 4 && en.length > 4 && (r.n.includes(en) || en.includes(r.n)))) &&
              Math.abs(r.ts - ets) < 3 * 86400000
            );
            if (dup) continue;
            const override = applyVenueOverride(e.venue || '', e.address || '');
            allIcfBatch.push({
              id: e.id,
              name: e.name,
              type: 'festival',
              vibe: 'concert',
              genres: e.genres || [],
              lat: override?.lat ?? e.lat ?? 0,
              lng: override?.lng ?? e.lng ?? 0,
              address: e.address || '',
              city,
              start_time: e.startTime,
              end_time: e.endTime || null,
              price_range: 'Voir billet',
              description: e.description || '',
              venue: e.venue || city,
              ticket_url: e.ticketUrl || null,
              source: 'infoconcert-festivals',
              updated_at: new Date().toISOString(),
              external_attendees: null,
            });
          }
        }

        if (allIcfBatch.length > 0) {
          // Chunk upsert (Postgrest handles up to ~1000 easily, but be safe)
          const CHUNK = 500;
          for (let i = 0; i < allIcfBatch.length; i += CHUNK) {
            const slice = allIcfBatch.slice(i, i + CHUNK);
            const { error: icfErr } = await supabase
              .from('cached_events')
              .upsert(slice, { onConflict: 'id' });
            if (icfErr) console.error('[ICF] upsert error:', icfErr.message);
          }
          console.log(`[ICF] Upserted ${allIcfBatch.length} festivals (after dedup vs RDF)`);
          totalInserted += allIcfBatch.length;
        } else {
          console.log('[ICF] No new festivals after dedup');
        }
      }
    } catch (e) {
      console.error('[ICF] Bulk fetch failed:', e);
    }

    console.log(`Total: ${totalInserted} events cached`);


    // Ping IndexNow (Bing/Yandex) so new events are discovered ASAP — fire-and-forget
    if (totalInserted > 0) {
      fetch(
        `${supabaseUrl}/functions/v1/indexnow-submit`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
      ).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, total: totalInserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refresh error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to refresh events. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
