-- ==============================================================
-- HOTSPOTS & LIVE PULSE
-- RPCs pour les nouvelles features :
--   - get_live_events     : events avec des check-ins récents
--   - get_tonight_hotspots: top events pour ce soir (par attendance)
--   - get_friend_hotspots : events où ≥N amis de l'utilisateur vont
-- ==============================================================

-- Events avec check-ins dans les dernières _since_hours heures.
-- Renvoie event_id + count (cumul des attendances créées récemment).
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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


-- Top events pour ce soir (entre maintenant et demain 06:00 local UTC)
-- classés par nombre total de check-ins.
CREATE OR REPLACE FUNCTION public.get_tonight_hotspots(_limit integer DEFAULT 10)
RETURNS TABLE (
  event_id text,
  event_name text,
  event_city text,
  event_date timestamptz,
  check_ins bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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


-- Events où ≥_min_friends amis de l'utilisateur courant vont.
-- Utilise auth.uid() côté serveur donc pas besoin de passer l'id.
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
-- VALIDATION QR PASS
-- Vérifie qu'un pass n'est pas expiré et n'a pas déjà été scanné.
-- On ajoute une colonne `used_at` au pass pour le "one-shot".
-- ==============================================================

ALTER TABLE public.event_passes
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

ALTER TABLE public.event_passes
  ADD COLUMN IF NOT EXISTS valid_until timestamptz;

-- Valide un pass pour l'utilisateur courant.
-- Renvoie un statut : 'valid' | 'expired' | 'already_used' | 'not_found'
CREATE OR REPLACE FUNCTION public.validate_event_pass(_pass_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
-- REALTIME sur event_attendance (pour la feature Live Pulse)
-- On ajoute la table à la publication realtime si elle n'y est pas.
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
