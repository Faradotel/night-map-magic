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
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Accept optional "city" param to refresh a single city
    let citiesToRefresh = CITIES;
    try {
      const body = await req.json();
      if (body?.city) {
        citiesToRefresh = [body.city];
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

    function getTypeVibe(e: any): { type: string; vibe: string } {
      const id: string = e.id || '';
      const name: string = e.name || '';
      if (id.startsWith('rt-')) return { type: 'sport', vibe: 'sport' };
      if (id.startsWith('sf-')) return { type: 'sport', vibe: 'sport' };
      if (id.startsWith('rdf-')) return { type: 'festival', vibe: 'concert' };
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
        fetchWithTimeout(`${supabaseUrl}/functions/v1/fetch-infoconcert`, { method: 'POST', headers, body }).then(r => r.json()),
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
        return {
          id: e.id,
          name: e.name || '',
          type,
          vibe,
          genres: e.genres || [],
          lat: e.lat || 0,
          lng: e.lng || 0,
          address: e.address || '',
          city: (e.city || city).replace(/\s*\(\d+\)\s*$/, '').trim(),
          start_time: e.startTime || new Date().toISOString(),
          end_time: e.endTime || null,
          price_range: e.price || '€10-20',
          description: e.description || '',
          venue: e.venue || '',
          ticket_url: e.ticketUrl || null,
          source: e.id?.startsWith('eb-') ? 'eventbrite' : e.id?.startsWith('tm-') ? 'ticketmaster' : e.id?.startsWith('mu-') ? 'meetup' : e.id?.startsWith('ic-') ? 'infoconcert' : e.id?.startsWith('rdf-') ? 'routedesfestivals' : e.id?.startsWith('bb-') ? 'brocabrac' : e.id?.startsWith('rt-') ? 'runtrail' : e.id?.startsWith('oa-') ? 'openagenda' : 'shotgun',
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

    // Process cities in parallel batches of 3 (~3x faster than sequential)
    const BATCH_SIZE = 3;
    for (let i = 0; i < citiesToRefresh.length; i += BATCH_SIZE) {
      const cityBatch = citiesToRefresh.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(cityBatch.map(processCity));
      for (const r of results) {
        if (r.status === 'fulfilled') totalInserted += r.value;
      }
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
    const missingDepts = ALL_DEPTS.filter(d => !coveredDepts.has(d));
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

    console.log(`Total: ${totalInserted} events cached`);

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
