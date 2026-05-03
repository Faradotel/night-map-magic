# Prompt Lovable — synthèse des changements PulseMap

Copie-colle **tout le bloc ci-dessous** dans la zone de prompt Lovable du projet
`night-map-magic`. Lovable propagera les changements sur la prod (Supabase + web).

---

## 🎯 Contexte

On finalise PulseMap (pulse-map.live). Voici la liste des modifs à appliquer :

1. Une nouvelle migration SQL (RPCs hotspots + Live Pulse + validation QR pass + realtime sur `event_attendance`)
2. De nouveaux hooks et composants frontend (Live Pulse, Tonight's Hotspots banner)
3. Les mises à jour des hooks et écrans existants (validation QR pass, EventMap, Index)
4. Le manifest PWA + les icônes (192/512/maskable/apple-touch)
5. Le README

Tous les fichiers sont déjà présents dans le repo (je viens de les pusher). Lance
juste la migration SQL côté Supabase et déclenche un nouveau build / deploy.

---

## 🗄️ MIGRATION SUPABASE À EXÉCUTER

Fichier déjà commit dans `supabase/migrations/20260420120000_hotspots_and_live_pulse.sql`.
Si Lovable ne l'applique pas automatiquement, exécute ce SQL dans Supabase :

```sql
-- ==============================================================
-- HOTSPOTS & LIVE PULSE
-- ==============================================================

CREATE OR REPLACE FUNCTION public.get_live_events(
  _since_hours integer DEFAULT 6,
  _limit integer DEFAULT 50
)
RETURNS TABLE (
  event_id text,
  event_name text,
  event_city text,
  event_date timestamptz,
  check_ins bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    ea.event_id,
    MAX(ea.event_name) AS event_name,
    MAX(ea.event_city) AS event_city,
    MAX(ea.event_date) AS event_date,
    COUNT(*)::bigint AS check_ins
  FROM public.event_attendance ea
  WHERE ea.created_at >= (now() - (_since_hours || ' hours')::interval)
  GROUP BY ea.event_id
  ORDER BY check_ins DESC, MAX(ea.created_at) DESC
  LIMIT _limit
$$;

CREATE OR REPLACE FUNCTION public.get_tonight_hotspots(_limit integer DEFAULT 10)
RETURNS TABLE (
  event_id text,
  event_name text,
  event_city text,
  event_date timestamptz,
  check_ins bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    ea.event_id,
    MAX(ea.event_name) AS event_name,
    MAX(ea.event_city) AS event_city,
    MAX(ea.event_date) AS event_date,
    COUNT(*)::bigint AS check_ins
  FROM public.event_attendance ea
  WHERE ea.event_date IS NULL
     OR (ea.event_date >= date_trunc('day', now())
         AND ea.event_date <  date_trunc('day', now()) + interval '30 hours')
  GROUP BY ea.event_id
  ORDER BY check_ins DESC
  LIMIT _limit
$$;

CREATE OR REPLACE FUNCTION public.get_friend_hotspots(
  _min_friends integer DEFAULT 2,
  _limit integer DEFAULT 20
)
RETURNS TABLE (
  event_id text,
  event_name text,
  event_city text,
  event_date timestamptz,
  friend_count bigint,
  friend_usernames text[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH my_friends AS (
    SELECT
      CASE WHEN f.user_a = auth.uid() THEN f.user_b ELSE f.user_a END AS friend_id
    FROM public.friendships f
    WHERE f.user_a = auth.uid() OR f.user_b = auth.uid()
  )
  SELECT
    ea.event_id,
    MAX(ea.event_name) AS event_name,
    MAX(ea.event_city) AS event_city,
    MAX(ea.event_date) AS event_date,
    COUNT(DISTINCT ea.user_id)::bigint AS friend_count,
    ARRAY_AGG(DISTINCT p.username) FILTER (WHERE p.username IS NOT NULL) AS friend_usernames
  FROM public.event_attendance ea
  JOIN my_friends mf ON mf.friend_id = ea.user_id
  LEFT JOIN public.profiles p ON p.user_id = ea.user_id
  WHERE ea.event_date IS NULL OR ea.event_date >= (now() - interval '1 hour')
  GROUP BY ea.event_id
  HAVING COUNT(DISTINCT ea.user_id) >= _min_friends
  ORDER BY friend_count DESC
  LIMIT _limit
$$;

-- ==============================================================
-- VALIDATION QR PASS (one-shot + expiration)
-- ==============================================================

ALTER TABLE public.event_passes
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

ALTER TABLE public.event_passes
  ADD COLUMN IF NOT EXISTS valid_until timestamptz;

CREATE OR REPLACE FUNCTION public.validate_event_pass(_pass_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _row public.event_passes%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.event_passes
  WHERE id = _pass_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF _row.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_used', 'used_at', _row.used_at);
  END IF;

  IF _row.valid_until IS NOT NULL AND _row.valid_until < now() THEN
    RETURN jsonb_build_object('status', 'expired', 'valid_until', _row.valid_until);
  END IF;

  UPDATE public.event_passes SET used_at = now() WHERE id = _pass_id;

  RETURN jsonb_build_object(
    'status', 'valid',
    'event_id', _row.event_id,
    'event_name', _row.event_name,
    'used_at', now()
  );
END;
$$;

-- ==============================================================
-- REALTIME pour la feature Live Pulse
-- ==============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_attendance'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendance';
  END IF;
END $$;
```

---

## 🛠️ FICHIERS FRONTEND À DÉPLOYER

Tous ces fichiers sont déjà dans le repo. Vérifie juste que Lovable les a bien
pris dans le build :

### Nouveaux fichiers
- `src/hooks/useLiveEvents.ts` — fetch live events via RPC + subscription realtime
- `src/hooks/useHotspots.ts` — fetch top hotspots ce soir + friend hotspots
- `src/components/TonightsHotspotsBanner.tsx` — banner horizontal en haut de la carte
- `supabase/migrations/20260420120000_hotspots_and_live_pulse.sql`
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`

### Fichiers modifiés
- `src/components/EventMap.tsx` — nouvelle prop `livePulseMap`, animation pulse + badge "+N"
- `src/pages/Index.tsx` — toggle Live Pulse, banner Hotspots, intégration `useLiveEvents`
- `src/hooks/useEventPass.ts` — méthode `validatePass`, types `PassValidationStatus` / `PassValidationResult`, colonnes `used_at` / `valid_until`
- `src/components/PassViewerScreen.tsx` — bouton "Valider mon entrée" + statuts (utilisé / expiré)
- `vite.config.ts` — manifest PWA complet (192/512/maskable/apple-touch)
- `index.html` — `<link rel="icon">` 192 + 512 + apple-touch
- `README.md` — documentation complète (stack, setup, archi, features, backend, deploy)

---

## ✅ CHECKS POST-DÉPLOIEMENT

1. **Migration appliquée** : dans Supabase Studio → SQL Editor, lance
   `SELECT proname FROM pg_proc WHERE proname IN ('get_live_events','get_tonight_hotspots','get_friend_hotspots','validate_event_pass');`
   → tu dois voir les 4 fonctions.

2. **Realtime activé** : dans Database → Replication → vérifie que
   `event_attendance` est dans la liste des tables publiées vers `supabase_realtime`.

3. **PWA valide** : ouvre `pulse-map.live` dans Chrome → DevTools → Application →
   Manifest. Les 5 icônes (incl. maskable) doivent toutes charger sans 404.

4. **Live Pulse** : sur la map, le bouton "Live" en haut s'allume vert quand tu
   cliques. Si quelqu'un check-in un event dans les 6h, son marker pulse + un
   badge "+N" apparaît.

5. **Hotspots banner** : si la base contient des `event_attendance` pour ce soir
   ou des amis, le banner horizontal apparaît au-dessus des contrôles top.

6. **QR pass** : sur un event où tu as un pass, le bouton "Valider mon entrée"
   passe le pass à `used_at = now()` côté serveur. Une 2e validation renvoie
   "déjà utilisé".

---

## 📦 RÉSUMÉ

```
Migrations SQL  : +1 fichier (4 RPCs + 2 colonnes + realtime)
Hooks ajoutés   : +2 (useLiveEvents, useHotspots)
Composants      : +1 (TonightsHotspotsBanner)
Composants modifiés : 4 (EventMap, Index, PassViewer, useEventPass)
Assets PWA      : +4 icônes
Config          : vite.config.ts + index.html
Doc             : README réécrit
TypeScript      : 0 erreur (`tsc --noEmit` OK)
```

Tout est rétro-compatible : aucune migration destructive, pas de breaking
change sur les API existantes. La feature Live Pulse est OFF par défaut
(toggle utilisateur).
