DELETE FROM public.cached_events
WHERE source = 'routedesfestivals'
  AND (
    city ~* '^(unknown|n/?a|not\s*(available|specified|provided|stated|listed|given)|non\s*sp[ée]cifi[ée]|non\s*renseign[ée]|à\s*confirmer|a\s*confirmer|à\s*d[ée]finir|a\s*d[ée]finir|to\s*be\s*(announced|defined|determined|confirmed)|tba|tbd|tbc|unspecified|undisclosed|placeholder|none|null|undefined|inconnu|inconnue|vide|empty|—|-+|\?+)$'
    OR venue ~* '^(unknown|not\s*specified|à\s*d[ée]finir|a\s*d[ée]finir|tba|tbd)'
    OR address ~* '^(unknown|not\s*specified|à\s*d[ée]finir|a\s*d[ée]finir)'
    OR city ~* '^\w+\s+(venue|city|address)$'
  );