// Dynamic sitemap of all upcoming events for SEO (Googlebot, etc.)
// Public endpoint, no auth required.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://pulse-map.live';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function slugify(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'event';
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('cached_events')
      .select('id,name,updated_at,start_time,end_time')
      .or(`start_time.gte.${nowIso},end_time.gte.${nowIso}`)
      .order('start_time', { ascending: true })
      .limit(40000); // sitemap.org limit is 50k URLs / 50MB

    if (error) throw error;

    const urls = (data || []).map((e) => {
      const slug = `${slugify(e.name)}-${e.id}`;
      const lastmod = (e.updated_at || e.start_time || nowIso).slice(0, 10);
      return `  <url><loc>${escapeXml(`${SITE}/evenements/${slug}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (e) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
});
