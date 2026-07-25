// Admin management for API keys: list, create, revoke
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `pm_live_${b64}`
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401)
    const userId = claimsData.claims.sub as string

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' })
    if (!isAdmin) return json({ error: 'Forbidden — admin only' }, 403)

    const url = new URL(req.url)
    const action = url.searchParams.get('action') ?? 'list'

    if (req.method === 'GET' || action === 'list') {
      const { data, error } = await admin
        .from('api_keys')
        .select('id, name, key_prefix, is_active, last_used_at, usage_count, created_at, revoked_at')
        .order('created_at', { ascending: false })
      if (error) return json({ error: error.message }, 500)
      return json({ keys: data })
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      if (body.action === 'revoke') {
        const { error } = await admin
          .from('api_keys')
          .update({ is_active: false, revoked_at: new Date().toISOString() })
          .eq('id', body.id)
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }

      const name = (body.name as string)?.trim() || 'Untitled key'
      const rawKey = generateKey()
      const keyHash = await sha256Hex(rawKey)
      const keyPrefix = rawKey.slice(0, 16)
      const { data, error } = await admin
        .from('api_keys')
        .insert({ name, key_hash: keyHash, key_prefix: keyPrefix, owner_id: userId })
        .select('id, name, key_prefix, created_at')
        .single()
      if (error) return json({ error: error.message }, 500)
      return json({ key: rawKey, meta: data, warning: 'Store this key now — it will not be shown again.' })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
