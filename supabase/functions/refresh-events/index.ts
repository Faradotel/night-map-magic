import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    console.log('Starting event refresh for all cities...');

    // Fetch from both sources for all cities in parallel batches
    const batchSize = 5;
    const allEvents: any[] = [];

    for (let i = 0; i < CITIES.length; i += batchSize) {
      const batch = CITIES.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.flatMap(city => [
          // Shotgun
          fetch(`${supabaseUrl}/functions/v1/scrape-shotgun`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ city }),
          }).then(r => r.json()).then(d => ({ source: 'shotgun', city, events: d?.events || [] })),
          // Ticketmaster
          fetch(`${supabaseUrl}/functions/v1/fetch-ticketmaster`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ city }),
          }).then(r => r.json()).then(d => ({ source: 'ticketmaster', city, events: d?.events || [] })),
        ])
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.events) {
          allEvents.push(...result.value.events);
        }
      }

      // Small delay between batches
      if (i + batchSize < CITIES.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`Fetched ${allEvents.length} total events from all sources`);

    // Deduplicate by ID
    const uniqueEvents = new Map<string, any>();
    for (const e of allEvents) {
      if (e.id && !uniqueEvents.has(e.id)) {
        uniqueEvents.set(e.id, e);
      }
    }

    console.log(`${uniqueEvents.size} unique events after dedup`);

    // Clear old events and insert new ones
    await supabase.from('cached_events').delete().neq('id', '');

    // Insert in batches of 100
    const eventsArray = Array.from(uniqueEvents.values());
    let inserted = 0;

    for (let i = 0; i < eventsArray.length; i += 100) {
      const batch = eventsArray.slice(i, i + 100).map((e: any) => ({
        id: e.id,
        name: e.name || '',
        type: 'soirée',
        vibe: 'rave',
        genres: e.genres || [],
        lat: e.lat || 0,
        lng: e.lng || 0,
        address: e.address || '',
        city: e.city || '',
        start_time: e.startTime || new Date().toISOString(),
        end_time: e.endTime || null,
        price_range: e.price || null,
        description: e.description || '',
        venue: e.venue || '',
        ticket_url: e.ticketUrl || null,
        source: e.id?.startsWith('tm-') ? 'ticketmaster' : 'shotgun',
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('cached_events').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error('Insert batch error:', error.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Inserted ${inserted} events into cache`);

    return new Response(
      JSON.stringify({ success: true, total: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refresh error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
