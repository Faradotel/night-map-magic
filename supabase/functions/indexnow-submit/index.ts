// IndexNow submission endpoint — pings Bing/Yandex with new/updated URLs.
// URL list comes from _shared/seo-routes.ts — shared with the sitemap.
// https://www.indexnow.org/documentation

import { getAllSeoUrls } from '../_shared/seo-routes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOST = 'pulse-map.live';
const KEY = '55585cec66274aa0700c0f81bc11d3b3';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Auth: require service-role bearer — this endpoint is for cron/internal use only
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const auth = req.headers.get('authorization') || '';
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }



  try {
    let urlList: string[] = [];

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      urlList = Array.isArray(body.urls) ? body.urls : [];
    }

    // Default: ping every SEO route (shared with the sitemap)
    if (urlList.length === 0) {
      urlList = getAllSeoUrls();
    }

    // IndexNow caps at 10 000 URLs per request
    const urls = urlList.filter(u => typeof u === 'string' && u.startsWith(`https://${HOST}/`)).slice(0, 10000);

    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid URLs to submit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    };

    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    return new Response(JSON.stringify({
      ok: res.ok,
      status: res.status,
      submitted: urls.length,
      indexNowResponse: text,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
