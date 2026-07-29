## Objectif

Éviter le cap dur de 1000 résultats/ville de Ticketmaster en ne récupérant que les events des 90 prochains jours — on garde les concerts et festivals à réserver, on coupe le bruit long-terme qui saturait la fenêtre.

## Changement

Dans `supabase/functions/fetch-ticketmaster/index.ts`, ajouter un `endDateTime = now + 90 jours` à côté du `startDateTime` déjà présent.

Format ISO attendu par Ticketmaster : `YYYY-MM-DDTHH:mm:ssZ` (sans millisecondes), même normalisation que `startDateTime`.

## Portée

- Uniquement `fetch-ticketmaster`. Les autres sources (Eventbrite, Shotgun, Meetup, OpenAgenda, Infoconcert, Brocabrac, etc.) ne sont pas touchées — elles ont leurs propres logiques et n'ont pas le cap 1000.
- Pas de changement de config, pas de migration, pas de UI.

## Impact attendu

- Grenoble : passait de 44 (music) → 494 (all, sans cap) → restera ~pareil (494 tient sous 1000 sur 90j).
- Grandes villes (Paris/Lyon/Marseille/Bordeaux/Nantes/Lille) qui saturaient le cap 1000 avec tout le futur : la fenêtre 90j fera passer sous le cap et rendra visibles les events proches qui étaient auparavant repoussés hors des 1000 premiers.
- Aucun event à J+91 ne sera plus importé jusqu'au prochain refresh (le cron tourne régulièrement, donc les events "glissent" dans la fenêtre au fil du temps).

## Vérification post-implémentation

Une fois le refresh relancé (via `/admin/indexation` ou cron), spot-check sur 2-3 villes que des events J+30 à J+80 apparaissent bien dans `cached_events` — ce qui n'était pas le cas avant sur les grandes villes à cause du cap.
