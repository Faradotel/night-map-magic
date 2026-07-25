// Public Events API — requires x-api-key header
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders as baseCors } from 'npm:@supabase/supabase-js@2/cors'

const corsHeaders = {
  ...baseCors,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = req.headers.get('x-api-key') ?? new URL(req.url).searchParams.get('api_key')
    if (!apiKey) return json({ error: 'Missing x-api-key header' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const keyHash = await sha256Hex(apiKey)
    const { data: verified, error: verifyErr } = await supabase.rpc('verify_api_key', { _key_hash: keyHash })
    if (verifyErr || !verified || (Array.isArray(verified) && verified.length === 0)) {
      return json({ error: 'Invalid or revoked API key' }, 401)
    }

    const url = new URL(req.url)
    const params = url.searchParams
    const limit = Math.min(parseInt(params.get('limit') ?? '500'), 2000)
    const offset = Math.max(parseInt(params.get('offset') ?? '0'), 0)
    const city = params.get('city')
    const genre = params.get('genre')
    const vibe = params.get('vibe')
    const source = params.get('source')
    const from = params.get('from') // ISO date
    const to = params.get('to')
    const includePast = params.get('include_past') === 'true'
    const lat = params.get('lat')
    const lng = params.get('lng')
    const radiusKm = params.get('radius_km')

    let q = supabase.from('cached_events').select('*', { count: 'exact' })

    if (city) q = q.ilike('city', city)
    if (genre) q = q.contains('genres', [genre])
    if (vibe) q = q.eq('vibe', vibe)
    if (source) q = q.eq('source', source)
    if (from) q = q.gte('start_time', from)
    if (to) q = q.lte('start_time', to)
    if (!includePast && !from) q = q.gte('start_time', new Date(Date.now() - 6 * 3600_000).toISOString())

    q = q.order('start_time', { ascending: true }).range(offset, offset + limit - 1)

    const { data, error, count } = await q
    if (error) return json({ error: error.message }, 500)

    let events = data ?? []

    // Optional client-side radius filter
    if (lat && lng && radiusKm) {
      const la = parseFloat(lat), ln = parseFloat(lng), r = parseFloat(radiusKm)
      const R = 6371
      events = events.filter((e: any) => {
        if (e.lat == null || e.lng == null) return false
        const dLat = (e.lat - la) * Math.PI / 180
        const dLng = (e.lng - ln) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(la * Math.PI / 180) * Math.cos(e.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        return 2 * R * Math.asin(Math.sqrt(a)) <= r
      })
    }

    return json({
      count: count ?? events.length,
      returned: events.length,
      limit,
      offset,
      events,
    })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
