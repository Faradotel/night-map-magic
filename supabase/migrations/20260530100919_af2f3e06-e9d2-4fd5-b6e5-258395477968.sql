DELETE FROM public.cached_events
WHERE source = 'routedesfestivals'
  AND (
    venue   ~* '^(unknown|n/?a|not\s*available|non\s*sp[ée]cifi[ée]|à\s*confirmer|a\s*confirmer|tba|unspecified|inconnu|inconnue)$'
    OR address ~* '^(unknown|unknown\s+address|n/?a|not\s*available|non\s*sp[ée]cifi[ée]|à\s*confirmer|a\s*confirmer|tba|unspecified|inconnu|inconnue)$'
    OR city    ~* '^(unknown|unknown\s+city|n/?a|not\s*available|non\s*sp[ée]cifi[ée]|à\s*confirmer|a\s*confirmer|tba|unspecified|inconnu|inconnue)$'
    OR venue   ~* '^unknown\s+\w+$'
    OR address ~* '^unknown\s+\w+$'
    OR city    ~* '^unknown\s+\w+$'
    OR venue   ~* '^\w+\s+(venue|city|address)$'
  );