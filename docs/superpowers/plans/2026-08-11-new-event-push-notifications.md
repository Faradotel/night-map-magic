# New Event Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a new event is inserted into `cached_events`, queue a web push notification for every user whose `preferred_city` matches the event's city and whose onboarding genre/vibe preferences overlap the event's `genres`/`vibe`, without blocking the batched event-ingestion upserts.

**Architecture:** An `AFTER INSERT` trigger on `cached_events` (mirroring the existing `on_attendance_created` pattern) writes rows into a new `push_outbox` table instead of calling `net.http_post` synchronously. A `pg_cron` job every 5 minutes invokes a new edge function, `process-push-outbox`, which drains pending rows and forwards each to the existing `send-push-notification` function. On the front end, the onboarding flow (first run and "edit preferences" from the profile) now persists `preferred_city` to `profiles` and genre/vibe/opt-in preferences to `notification_preferences` — both currently only live in `localStorage`.

**Tech Stack:** Supabase Postgres (pg_cron, pg_net, plpgsql), Supabase Edge Functions (Deno), React/TypeScript front end, Vitest.

## Global Constraints

- Notification title: `"🎉 Nouvel event à [ville] !"`
- Notification body: `[nom de l'event] + date courte`
- Trigger only queues a notification when `NEW.start_time BETWEEN now() AND now() + interval '7 days'`
- No synchronous HTTP from the `cached_events` trigger — writes go to `push_outbox`, a separate cron drains it
- `push_outbox` columns: `id, user_id, title, body, url, created_at, sent_at, status`
- `notification_preferences` gains: `new_event_alerts_enabled BOOLEAN DEFAULT false`, `preferred_genres TEXT[] DEFAULT '{}'`, `preferred_vibes TEXT[] DEFAULT '{}'`
- Empty `preferred_genres`/`preferred_vibes` array means "no restriction" (matches the existing `tagsToFilterPatch` semantics in `src/hooks/useOnboardingPreferences.ts:26-31`)
- Follow the existing migration convention: no real secret values committed to git (see `supabase/migrations/20260811074353_a59595b6-a4e0-40f6-96ff-fae5e61396a2.sql:6-9` for the pattern)

## Correction to a prior assumption

Earlier in this conversation I said `profiles.preferred_city` was "persisted." The column exists (`supabase/migrations/20260221084629_c5f4dfa9-c072-4aea-8c40-4f562f407d78.sql:10`), but nothing in the app writes to it — `src/hooks/usePreferredCity.tsx` is 100% `localStorage`. Every user's `preferred_city` sits at the `'Paris'` default forever. This plan fixes that as part of Task 6 (without it, the trigger's city match would be meaningless for almost all users).

---

## File Structure

**New migrations** (`supabase/migrations/`, applied in order):
- `20260811150000_notification_preferences_new_event_columns.sql` — adds the 3 columns
- `20260811150100_push_outbox.sql` — creates `push_outbox`
- `20260811150200_new_event_notify_trigger.sql` — trigger function + trigger on `cached_events`
- `20260811150300_push_outbox_cron.sql` — pg_cron schedule calling `process-push-outbox`

**New edge function:**
- `supabase/functions/process-push-outbox/index.ts` — cron-invoked outbox drainer

**Modified:**
- `supabase/config.toml` — register `process-push-outbox` with `verify_jwt = false`
- `src/integrations/supabase/types.ts` — hand-add the new columns/table (no `supabase gen types` CLI in this repo's devDependencies, confirmed via `package.json`)
- `src/lib/notificationPreferencesSync.ts` (new) — pure payload builder + Supabase sync helper
- `src/pages/Index.tsx` — call the sync helper from `handleOnboardingComplete` (`src/pages/Index.tsx:467-483`)
- `src/components/ProfileScreen.tsx` — add a "new event alerts" toggle next to the existing friend-notifications toggle (`src/components/ProfileScreen.tsx:53,70-88`)

---

### Task 1: Migration — `notification_preferences` new columns

**Files:**
- Create: `supabase/migrations/20260811150000_notification_preferences_new_event_columns.sql`

**Interfaces:**
- Produces: `public.notification_preferences.new_event_alerts_enabled BOOLEAN`, `.preferred_genres TEXT[]`, `.preferred_vibes TEXT[]` — consumed by Task 3 (trigger) and Task 6/7 (front end)

- [ ] **Step 1: Write the migration**

```sql
-- New-event push notifications: per-user opt-in + genre/vibe match filters.
ALTER TABLE public.notification_preferences
  ADD COLUMN new_event_alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN preferred_genres TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN preferred_vibes TEXT[] NOT NULL DEFAULT '{}';
```

- [ ] **Step 2: Apply and verify in the Supabase SQL editor**

Run the migration against the project (`rhzojoyxldrllxroyyqt`), then verify:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notification_preferences'
ORDER BY ordinal_position;
```

Expected: `new_event_alerts_enabled` (boolean, default `false`), `preferred_genres` and `preferred_vibes` (ARRAY, default `'{}'::text[]`) appear alongside the existing columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260811150000_notification_preferences_new_event_columns.sql
git commit -m "db: add new-event alert columns to notification_preferences"
```

---

### Task 2: Migration — `push_outbox` table

**Files:**
- Create: `supabase/migrations/20260811150100_push_outbox.sql`

**Interfaces:**
- Produces: `public.push_outbox` table — written by Task 3's trigger, read/updated by Task 4's edge function

- [ ] **Step 1: Write the migration**

```sql
-- Outbox queue for push notifications triggered from DB rows (e.g. new events).
-- Decouples row-insert triggers from the actual HTTP send, so a batched upsert
-- (refresh-events runs across 51 cities every 4h) never blocks on webpush calls.
CREATE TABLE public.push_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_push_outbox_pending ON public.push_outbox (created_at) WHERE status = 'pending';

ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: this is an internal queue containing notification
-- content per user, read/written only by the service-role edge function
-- (service_role bypasses RLS), same trust boundary as push_subscriptions writes
-- from triggers.
```

- [ ] **Step 2: Apply and verify**

```sql
INSERT INTO public.push_outbox (user_id, title, body, url)
VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test body', '/test');

SELECT id, status, sent_at FROM public.push_outbox WHERE title = 'test';
-- Expected: one row, status = 'pending', sent_at = NULL

DELETE FROM public.push_outbox WHERE title = 'test';
```

Note: the test insert above will fail with a FK violation unless that UUID exists in `auth.users` — replace it with a real user id from `SELECT id FROM auth.users LIMIT 1;` when running this check.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260811150100_push_outbox.sql
git commit -m "db: add push_outbox table for decoupled push delivery"
```

---

### Task 3: Migration — new-event trigger

**Files:**
- Create: `supabase/migrations/20260811150200_new_event_notify_trigger.sql`

**Interfaces:**
- Consumes: `public.notification_preferences.{new_event_alerts_enabled,preferred_genres,preferred_vibes}` (Task 1), `public.push_outbox` (Task 2), `public.profiles.preferred_city`, `public.cached_events.{city,genres,vibe,name,start_time,id}`
- Produces: rows in `public.push_outbox` — consumed by Task 4

- [ ] **Step 1: Write the migration**

```sql
-- Mirrors handle_attendance_notify's shape (see
-- 20260811074353_a59595b6-a4e0-40f6-96ff-fae5e61396a2.sql) but writes to the
-- push_outbox queue instead of calling net.http_post synchronously, since this
-- fires per-row inside refresh-events' batched upserts across 51 cities.
CREATE OR REPLACE FUNCTION public.handle_new_event_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  short_date TEXT;
BEGIN
  short_date := to_char(NEW.start_time AT TIME ZONE 'Europe/Paris', 'DD/MM à HH24:MI');

  INSERT INTO public.push_outbox (user_id, title, body, url)
  SELECT
    p.user_id,
    '🎉 Nouvel event à ' || NEW.city || ' !',
    NEW.name || ' — ' || short_date,
    '/evenements/' || NEW.id
  FROM public.profiles p
  JOIN public.notification_preferences np ON np.user_id = p.user_id
  WHERE p.preferred_city = NEW.city
    AND np.new_event_alerts_enabled = true
    AND (np.preferred_genres = '{}' OR np.preferred_genres && NEW.genres)
    AND (np.preferred_vibes = '{}' OR NEW.vibe = ANY(np.preferred_vibes))
    AND EXISTS (SELECT 1 FROM public.push_subscriptions ps WHERE ps.user_id = p.user_id);

  RETURN NEW;
END;
$$;

-- WHEN clause: skip the function call entirely for events outside the 7-day
-- window, so past/far-future events (routine ingestion re-syncs, long-lead
-- festival listings) never touch the outbox. NEW.city IS NOT NULL is
-- currently always true (cached_events.city is NOT NULL at the column level)
-- — kept as a defensive, zero-cost guard in case that constraint ever loosens.
CREATE TRIGGER on_cached_event_created
  AFTER INSERT ON public.cached_events
  FOR EACH ROW
  WHEN (NEW.city IS NOT NULL AND NEW.start_time BETWEEN now() AND now() + interval '7 days')
  EXECUTE FUNCTION public.handle_new_event_notify();

REVOKE EXECUTE ON FUNCTION public.handle_new_event_notify() FROM PUBLIC, anon, authenticated;
```

- [ ] **Step 2: Apply and verify end-to-end**

Requires at least one test user with `profiles.preferred_city`, `notification_preferences.new_event_alerts_enabled = true`, and a `push_subscriptions` row (real or dummy endpoint — the trigger only checks existence, it doesn't send).

```sql
-- Setup (replace <user_id> with a real auth.users id):
UPDATE public.profiles SET preferred_city = 'Grenoble' WHERE user_id = '<user_id>';
UPDATE public.notification_preferences
SET new_event_alerts_enabled = true, preferred_genres = '{}', preferred_vibes = '{}'
WHERE user_id = '<user_id>';
INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
VALUES ('<user_id>', 'https://test.example/endpoint', 'dummy-p256dh', 'dummy-auth')
ON CONFLICT (endpoint) DO NOTHING;

-- Trigger it:
INSERT INTO public.cached_events (id, name, type, vibe, genres, lat, lng, city, start_time, source)
VALUES ('test-trigger-1', 'Test Event', 'concert', 'concert', ARRAY['techno'], 45.19, 5.72, 'Grenoble', now() + interval '1 day', 'shotgun');

-- Verify:
SELECT * FROM public.push_outbox WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
-- Expected: one row, status='pending', title = '🎉 Nouvel event à Grenoble !'

-- Cleanup:
DELETE FROM public.cached_events WHERE id = 'test-trigger-1';
DELETE FROM public.push_outbox WHERE user_id = '<user_id>';
DELETE FROM public.push_subscriptions WHERE endpoint = 'https://test.example/endpoint';
```

Also verify the 7-day guard: repeat with `start_time` set to `now() + interval '30 days'` and confirm no `push_outbox` row is created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260811150200_new_event_notify_trigger.sql
git commit -m "db: queue push_outbox entries when new matching events are inserted"
```

---

### Task 4: Edge function — `process-push-outbox`

**Files:**
- Create: `supabase/functions/process-push-outbox/index.ts`
- Modify: `supabase/config.toml`

**Interfaces:**
- Consumes: `public.push_outbox` rows (Task 2/3), `supabase/functions/send-push-notification/index.ts`'s existing contract (`POST { user_id, title, body, url }`, `Authorization: Bearer <service-role-key>`)
- Produces: HTTP endpoint `/functions/v1/process-push-outbox`, invoked by Task 5's cron

- [ ] **Step 1: Write the edge function**

```typescript
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
```

- [ ] **Step 2: Register the function (no JWT verification — auth is the shared secret)**

Edit `supabase/config.toml`:

```toml
[functions.process-push-outbox]
verify_jwt = false
```

- [ ] **Step 3: Set the `PUSH_OUTBOX_SECRET` function secret**

Manually (not committed to git — same reasoning as the existing `push_notification_service_key` vault secret): set a random value as the `PUSH_OUTBOX_SECRET` secret for this function in the Supabase dashboard (Edge Functions → process-push-outbox → Secrets), and note the same value for Task 5's vault secret.

- [ ] **Step 4: Deploy and verify manually**

After deploying, insert a test `push_outbox` row (see Task 2 Step 2 pattern) with a real `push_subscriptions` endpoint if you want to confirm actual delivery, or a dummy one to confirm status transitions:

```bash
curl -X POST 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/process-push-outbox' \
  -H 'x-outbox-secret: <the secret you set>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected: `{"success":true,"processed":1,"sent":1,"failed":0}` (or `sent:0,failed:1` for a dummy endpoint, since `web-push` will reject it — either way confirms the row's `status` changed away from `'pending'`). Then:

```sql
SELECT status, sent_at FROM public.push_outbox ORDER BY created_at DESC LIMIT 1;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/process-push-outbox/index.ts supabase/config.toml
git commit -m "feat: add process-push-outbox edge function to drain the push queue"
```

---

### Task 5: Migration — cron schedule for the outbox drainer

**Files:**
- Create: `supabase/migrations/20260811150300_push_outbox_cron.sql`

**Interfaces:**
- Consumes: `process-push-outbox` endpoint (Task 4)

- [ ] **Step 1: Write the migration**

```sql
-- Drain push_outbox every 5 minutes. Requires a Vault secret named
-- 'push_outbox_shared_secret' holding the same value configured as the
-- PUSH_OUTBOX_SECRET function secret in Task 4 — create it manually (not
-- checked in here):
--   select vault.create_secret('<same-value-as-PUSH_OUTBOX_SECRET>', 'push_outbox_shared_secret', 'Shared secret for process-push-outbox cron calls');
SELECT cron.schedule(
  'push-outbox-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/process-push-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-outbox-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'push_outbox_shared_secret' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cron$
);
```

- [ ] **Step 2: Apply, create the vault secret, and verify the schedule exists**

Run the migration, then create the vault secret manually via the SQL editor (value matching `PUSH_OUTBOX_SECRET` from Task 4 Step 3):

```sql
SELECT vault.create_secret('<same-value-as-PUSH_OUTBOX_SECRET>', 'push_outbox_shared_secret', 'Shared secret for process-push-outbox cron calls');

SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'push-outbox-every-5min';
```

Expected: one row, `schedule = '*/5 * * * *'`, `active = true`. Wait 5+ minutes (or manually run the `net.http_post` body once) and re-check `push_outbox` rows transition out of `'pending'`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260811150300_push_outbox_cron.sql
git commit -m "db: schedule push_outbox drainer every 5 minutes"
```

---

### Task 6: Front end — persist city + genre/vibe preferences

**Files:**
- Create: `src/lib/notificationPreferencesSync.ts`
- Test: `src/test/notificationPreferencesSync.test.ts`
- Modify: `src/pages/Index.tsx:467-483` (`handleOnboardingComplete`)
- Modify: `src/integrations/supabase/types.ts:407-430` (notification_preferences), `:524-553` (profiles unaffected — column already typed), add `push_outbox` block near `:554` (push_subscriptions) for type completeness

**Interfaces:**
- Consumes: `InterestTag`, `tagsToFilterPatch` from `src/hooks/useOnboardingPreferences.ts:7,26`; `supabase` client from `src/integrations/supabase/client.ts`
- Produces: `buildNotificationPrefsPayload(tags: InterestTag[]): { new_event_alerts_enabled: boolean; preferred_genres: string[]; preferred_vibes: string[] }` and `syncOnboardingPreferences(input: { userId: string; cityName: string | null; tags: InterestTag[] }): Promise<void>` — consumed by `Index.tsx`

- [ ] **Step 1: Write the failing test for the pure payload builder**

```typescript
// src/test/notificationPreferencesSync.test.ts
import { describe, it, expect } from 'vitest';
import { buildNotificationPrefsPayload } from '@/lib/notificationPreferencesSync';

describe('buildNotificationPrefsPayload', () => {
  it('disables alerts and clears filters when no tags are selected', () => {
    const result = buildNotificationPrefsPayload([]);
    expect(result).toEqual({
      new_event_alerts_enabled: false,
      preferred_genres: [],
      preferred_vibes: [],
    });
  });

  it('enables alerts and derives genres/vibes from selected tags', () => {
    const result = buildNotificationPrefsPayload(['techno']);
    expect(result.new_event_alerts_enabled).toBe(true);
    expect(result.preferred_genres).toContain('techno');
  });

  it('treats "everything selected" the same as no restriction', () => {
    const all: import('@/hooks/useOnboardingPreferences').InterestTag[] = [
      'techno', 'house', 'hiphop', 'rock', 'concerts', 'bars', 'festivals', 'culture', 'sport', 'afterwork',
    ];
    const result = buildNotificationPrefsPayload(all);
    expect(result.new_event_alerts_enabled).toBe(true);
    expect(result.preferred_genres).toEqual([]);
    expect(result.preferred_vibes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/notificationPreferencesSync.test.ts`
Expected: FAIL — `Cannot find module '@/lib/notificationPreferencesSync'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/notificationPreferencesSync.ts
import { supabase } from '@/integrations/supabase/client';
import { InterestTag, tagsToFilterPatch } from '@/hooks/useOnboardingPreferences';

export function buildNotificationPrefsPayload(tags: InterestTag[]) {
  const { genres, vibes } = tagsToFilterPatch(tags);
  return {
    new_event_alerts_enabled: tags.length > 0,
    preferred_genres: genres,
    preferred_vibes: vibes,
  };
}

export interface SyncOnboardingPreferencesInput {
  userId: string;
  cityName: string | null;
  tags: InterestTag[];
}

// Called both at the end of first-run onboarding and after "edit preferences"
// from the profile screen (both funnel through Index.tsx's handleOnboardingComplete).
// Upsert (not update): handle_new_user creates a notification_preferences row
// at signup, but we don't want a silent no-op for any account that predates
// that trigger or otherwise lacks a row.
export async function syncOnboardingPreferences({ userId, cityName, tags }: SyncOnboardingPreferencesInput): Promise<void> {
  const payload = buildNotificationPrefsPayload(tags);
  await Promise.all([
    cityName
      ? supabase.from('profiles').update({ preferred_city: cityName }).eq('user_id', userId)
      : Promise.resolve(),
    supabase.from('notification_preferences').upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' }),
  ]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/notificationPreferencesSync.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire the sync call into `handleOnboardingComplete`**

In `src/pages/Index.tsx`, add the import near the other hook imports (line ~14-17):

```typescript
import { syncOnboardingPreferences } from '@/lib/notificationPreferencesSync';
```

Modify `handleOnboardingComplete` (currently `src/pages/Index.tsx:467-483`):

```typescript
  const handleOnboardingComplete = useCallback((city: City | null, tags: InterestTag[]) => {
    if (city) {
      setPreferredCity(city.name);
      setSelectedCityName(city.name);
      setLocationMode('city');
      setFilterCenter([city.lat, city.lng]);
      setMapCenter([city.lat, city.lng]);
      setMapZoom(DEFAULT_ZOOM);
    }
    setOnboardingTags(tags);
    setFilters((prev) => ({
      ...prev,
      ...(city ? { radiusKm: CITY_RADIUS_DEFAULT } : {}),
      ...tagsToFilterPatch(tags),
    }));
    completeOnboarding();

    if (user) {
      syncOnboardingPreferences({ userId: user.id, cityName: city?.name ?? null, tags }).catch((err) => {
        console.error('Index: failed to sync onboarding preferences', err);
      });
    }
  }, [setPreferredCity, setOnboardingTags, completeOnboarding, user]);
```

- [ ] **Step 6: Hand-add the new columns to the generated types file**

In `src/integrations/supabase/types.ts`, extend the `notification_preferences` block (currently `:407-430`):

```typescript
      notification_preferences: {
        Row: {
          created_at: string
          friend_attendance_enabled: boolean
          id: string
          new_event_alerts_enabled: boolean
          preferred_genres: string[]
          preferred_vibes: string[]
          push_enabled: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_attendance_enabled?: boolean
          id?: string
          new_event_alerts_enabled?: boolean
          preferred_genres?: string[]
          preferred_vibes?: string[]
          push_enabled?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          friend_attendance_enabled?: boolean
          id?: string
          new_event_alerts_enabled?: boolean
          preferred_genres?: string[]
          preferred_vibes?: string[]
          push_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
```

Then add a `push_outbox` block alphabetically before the existing `push_subscriptions` block (currently `:554`):

```typescript
      push_outbox: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_at: string | null
          status: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
```

- [ ] **Step 7: Run the full test suite and typecheck**

Run: `npm run test`
Expected: all tests pass, including the 3 new ones.

Run: `npx tsc --noEmit` (or `npm run build` if no bare typecheck script exists)
Expected: no new type errors from `Index.tsx` or `types.ts`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/notificationPreferencesSync.ts src/test/notificationPreferencesSync.test.ts src/pages/Index.tsx src/integrations/supabase/types.ts
git commit -m "feat: sync onboarding city/genre/vibe preferences to Supabase"
```

---

### Task 7: Front end — profile toggle for new-event alerts

**Files:**
- Modify: `src/components/ProfileScreen.tsx:53,60-88` and the notifications section of its JSX (search for the existing `friendNotifs` toggle markup)

**Interfaces:**
- Consumes: `notification_preferences.new_event_alerts_enabled` (Task 1)

- [ ] **Step 1: Load the new flag alongside `friend_attendance_enabled`**

In `src/components/ProfileScreen.tsx`, add state near `friendNotifs` (currently line 53):

```typescript
  const [friendNotifs, setFriendNotifs] = useState(true);
  const [newEventAlerts, setNewEventAlerts] = useState(false);
```

Extend the profile-loading effect (currently `:60-77`):

```typescript
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('friend_attendance_enabled, new_event_alerts_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      if (prefs) {
        setFriendNotifs(prefs.friend_attendance_enabled);
        setNewEventAlerts(prefs.new_event_alerts_enabled);
      }
```

- [ ] **Step 2: Add the toggle handler**

Next to `toggleFriendNotifs` (currently `:79-88`):

```typescript
  const toggleNewEventAlerts = async () => {
    const next = !newEventAlerts;
    setNewEventAlerts(next);
    if (user) {
      await supabase
        .from('notification_preferences')
        .update({ new_event_alerts_enabled: next })
        .eq('user_id', user.id);
    }
  };
```

- [ ] **Step 3: Add the UI toggle**

Find the JSX block that renders the `friendNotifs` toggle (a switch/button calling `toggleFriendNotifs`) and add a matching row directly below it calling `toggleNewEventAlerts`, with label text along the lines of "Alertes nouveaux events" — match the existing toggle's markup exactly (same component/classNames) so it's visually consistent; do not introduce a new toggle component.

- [ ] **Step 4: Manual UI verification**

Run `npm run dev`, sign in, open the profile screen, confirm:
- The new toggle reflects the DB value on load
- Toggling it updates `notification_preferences.new_event_alerts_enabled` (check via Supabase SQL editor or the network tab)
- No regression to the existing friend-notifications toggle

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfileScreen.tsx
git commit -m "feat: add profile toggle for new-event push alerts"
```

---

### Task 8: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm the full pipeline with a real refresh cycle**

1. In the app (or via SQL), set a test user's `profiles.preferred_city` to a city in the `CITIES` list (`supabase/functions/refresh-events/index.ts:20-30`), e.g. `'Grenoble'`, and `notification_preferences.new_event_alerts_enabled = true` with empty `preferred_genres`/`preferred_vibes` (matches everything).
2. Ensure that user has a real `push_subscriptions` row (subscribe via the app UI in a browser with notifications granted).
3. Manually trigger a single-city refresh: `curl -X POST 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/refresh-events' -H 'x-refresh-secret: <refresh_events_shared_secret value>' -H 'Content-Type: application/json' -d '{"city":"Grenoble"}'`
4. Check `push_outbox` for new rows tied to that user: `SELECT * FROM push_outbox WHERE user_id = '<user_id>' ORDER BY created_at DESC;`
5. Wait up to 5 minutes (or manually curl `process-push-outbox` as in Task 4 Step 4) and confirm the row's `status` becomes `'sent'`.
6. Confirm a real push notification arrived in the browser.

- [ ] **Step 2: Confirm the 7-day and city/genre filters hold under real data**

Spot-check a few rows in `cached_events` inserted during the refresh: for any with `start_time` beyond 7 days out, confirm no corresponding `push_outbox` row exists for the test user. For any with `genres`/`vibe` that don't overlap a second test user's narrower `preferred_genres`/`preferred_vibes`, confirm no row was queued for that second user.

---

## Self-Review Notes

- Spec coverage: persistence (Task 1, 6), outbox pattern (Task 2, 4, 5), 7-day guard (Task 3), notification copy (Task 3) — all covered.
- The `preferred_city` gap (nothing previously wrote it) is fixed in Task 6, called out explicitly since it wasn't part of the original decision list but blocks the whole feature without it.
- Type consistency checked: `buildNotificationPrefsPayload`/`syncOnboardingPreferences` signatures in Task 6 match their call site in `Index.tsx`; `push_outbox` column names match between Task 2's SQL, Task 3's `INSERT`, Task 4's `select`, and Task 6's hand-added types.
