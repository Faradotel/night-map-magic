
CREATE TABLE public.event_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_city TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.event_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.event_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.event_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
