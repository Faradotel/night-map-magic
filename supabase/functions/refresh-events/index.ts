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

    // Accept optional "city" param to refresh a single city
    let citiesToRefresh = CITIES;
    try {
      const body = await req.json();
      if (body?.city) {
        citiesToRefresh = [body.city];
      }
    } catch { /* no body = refresh all */ }

    console.log(`Refreshing ${citiesToRefresh.length} cities...`);

    let totalInserted = 0;

    // Process cities ONE AT A TIME to avoid timeout
    for (const city of citiesToRefresh) {
      try {
        // Fetch from both sources for this city
        const [shotgunRes, tmRes, ebRes] = await Promise.allSettled([
          fetch(`${supabaseUrl}/functions/v1/scrape-shotgun`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ city }),
          }).then(r => r.json()),
          fetch(`${supabaseUrl}/functions/v1/fetch-ticketmaster`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ city }),
          }).then(r => r.json()),
          fetch(`${supabaseUrl}/functions/v1/fetch-eventbrite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ city }),
          }).then(r => r.json()),
        ]);

        const events: any[] = [];
        if (shotgunRes.status === 'fulfilled' && shotgunRes.value?.events) {
          events.push(...shotgunRes.value.events);
        }
        if (tmRes.status === 'fulfilled' && tmRes.value?.events) {
          events.push(...tmRes.value.events);
        }
        if (ebRes.status === 'fulfilled' && ebRes.value?.events) {
          events.push(...ebRes.value.events);
        }

        if (events.length === 0) continue;

        // Delete old events for this city, then insert new ones
        await supabase.from('cached_events').delete().eq('city', city);

        const batch = events.map((e: any) => ({
          id: e.id,
          name: e.name || '',
          type: 'soirée',
          vibe: 'rave',
          genres: e.genres || [],
          lat: e.lat || 0,
          lng: e.lng || 0,
          address: e.address || '',
          city: e.city || city,
          start_time: e.startTime || new Date().toISOString(),
          end_time: e.endTime || null,
          price_range: e.price || '€10-20',
          description: e.description || '',
          venue: e.venue || '',
          ticket_url: e.ticketUrl || null,
          source: e.id?.startsWith('eb-') ? 'eventbrite' : e.id?.startsWith('tm-') ? 'ticketmaster' : 'shotgun',
          updated_at: new Date().toISOString(),
          external_attendees: e.externalAttendees || null,
        }));

        const { error } = await supabase.from('cached_events').upsert(batch, { onConflict: 'id' });
        if (error) {
          console.error(`Error inserting ${city}:`, error.message);
        } else {
          totalInserted += batch.length;
          console.log(`${city}: ${batch.length} events cached`);
        }
      } catch (err) {
        console.error(`Failed to refresh ${city}:`, err);
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
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
