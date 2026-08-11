import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-outbox-secret',
};

const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Invoked only from pg_cron via net.http_post with a Vault-stored shared
    // secret — same trust boundary as refresh-events (no browser ever calls this).
    const outboxSecret = Deno.env.get('PUSH_OUTBOX_SECRET') || '';
    const providedSecret = req.headers.get('x-outbox-secret') || '';
    if (outboxSecret === '' || providedSecret !== outboxSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: pending, error: fetchError } = await supabase
      .from('push_outbox')
      .select('id, user_id, title, body, url')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const results = await Promise.allSettled(
      pending.map(async (row) => {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ user_id: row.user_id, title: row.title, body: row.body, url: row.url }),
        });
        if (!res.ok) throw new Error(`send-push-notification returned ${res.status}`);
        const body = await res.json();
        if (!body.sent || body.sent === 0) throw new Error('No notifications sent (all subscriptions expired or missing)');
        return row.id;
      }),
    );

    const sentIds = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);
    const failedIds = pending
      .map((row) => row.id)
      .filter((id) => !sentIds.includes(id));

    if (sentIds.length > 0) {
      await supabase
        .from('push_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', sentIds);
    }
    if (failedIds.length > 0) {
      await supabase.from('push_outbox').update({ status: 'failed' }).in('id', failedIds);
    }

    return new Response(
      JSON.stringify({ success: true, processed: pending.length, sent: sentIds.length, failed: failedIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
