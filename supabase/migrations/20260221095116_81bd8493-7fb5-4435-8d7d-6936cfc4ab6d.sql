
-- Allow anyone authenticated to look up share codes (needed for the join-by-code feature)
DROP POLICY "Users can view own codes" ON public.share_codes;

CREATE POLICY "Anyone authenticated can look up codes"
ON public.share_codes
FOR SELECT
USING (auth.uid() IS NOT NULL);
