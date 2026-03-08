
-- Add image_url column to cached_events
ALTER TABLE public.cached_events ADD COLUMN IF NOT EXISTS image_url text;

-- Allow pro users to INSERT into cached_events
CREATE POLICY "Pro users can insert events"
ON public.cached_events FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'pro') OR public.has_role(auth.uid(), 'admin'));

-- Allow pro users to UPDATE their own events (user-prefixed)
CREATE POLICY "Pro users can update own events"
ON public.cached_events FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'pro') OR public.has_role(auth.uid(), 'admin'));

-- Create event-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event-images bucket
CREATE POLICY "Pro users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images' AND (public.has_role(auth.uid(), 'pro') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

CREATE POLICY "Pro users can delete own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images' AND (public.has_role(auth.uid(), 'pro') OR public.has_role(auth.uid(), 'admin')));
