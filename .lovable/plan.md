
## Objectif

Suivre le statut d'indexation Google de chaque page SEO programmatique et retirer automatiquement (410-like) celles qui restent "Detected, not indexed" après 6 semaines.

## ⚠️ Limite honnête à connaître

Lovable héberge en SPA statique : on **ne peut pas renvoyer un vrai HTTP 410**. Le "410 Gone" sera émulé par :
- retrait immédiat du sitemap
- `<meta robots="noindex">` sur la page
- redirection client vers la ville parente (ex : `/genres/techno/nimes` retiré → redirect vers `/sortir-ce-soir/nimes`)
- `X-Robots-Tag` impossible sans SSR

C'est le maximum atteignable sans migrer vers du SSR. Googlebot désindexe en 2-4 semaines avec ce combo.

## Composants

### 1. Table `page_index_status`
Suit chaque URL SEO : `url`, `first_tracked_at`, `last_checked_at`, `coverage_state` (Submitted and indexed / Crawled - currently not indexed / Discovered - not indexed / URL is unknown to Google), `last_crawl_time`, `is_indexed`, `retired_at`, `retire_reason`. RLS admin-only.

### 2. Edge function `gsc-check-index-status` (cron quotidien)
- Récupère 500 URLs (LRU sur `last_checked_at`) depuis `page_index_status`
- Pour chaque : appelle `POST /v1/urlInspection/index:inspect` via le connecteur Google Search Console déjà connecté (utilise `GOOGLE_SEARCH_CONSOLE_API_KEY`)
- Upsert `coverage_state`, `is_indexed`, `last_crawl_time`, `last_checked_at`
- Rate limit : 60 req/min, batch séquentiel avec délai
- Bootstrap : au premier run, insère toutes les URLs de `getAllSeoUrls()` avec `first_tracked_at = now()`
- Cron pg_cron : `0 3 * * *` (3h du matin)

### 3. Edge function `retire-underperforming-pages` (cron hebdomadaire)
Règles de retrait (dimanche 4h) :
- Page a `first_tracked_at` > 42 jours (6 semaines)
- `coverage_state` ∈ ("Discovered - currently not indexed", "Crawled - currently not indexed", "URL is unknown to Google")
- `retired_at IS NULL`
- **Exception** : jamais retirer les 15 villes Tier 1 (Paris, Lyon…) même si non indexées
- → set `retired_at = now()`, `retire_reason = coverage_state`

### 4. Génération sitemap
`scripts/generate-sitemap.ts` : au build, fetch les URLs `retired_at IS NOT NULL` via la clé service et les exclut des `sitemap-tier{1,2,3}.xml`.

### 5. Front — pages retirées
Nouveau hook `useRetiredPageRedirect(pathname)` :
- Query `page_index_status` par `url = pathname`
- Si `retired_at != null` :
  - injecte `<Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>`
  - redirige (React Router `<Navigate replace>`) vers la ville parente extraite du path
- Branché dans `CategoryPage`, `TagPage` (genres/ambiances), et pages ville

### 6. Page admin `/admin/indexation`
Dashboard simple protégé par `has_role(admin)` :
- KPIs : total tracked / indexed / not indexed / retired
- Table filtrable (par tier, par coverage_state, par âge)
- Bouton "vérifier maintenant" (invoque l'edge function pour une URL)
- Bouton "restaurer" une page retirée

## Fichiers touchés

**Créés**
- `supabase/functions/gsc-check-index-status/index.ts`
- `supabase/functions/retire-underperforming-pages/index.ts`
- `src/hooks/useRetiredPageRedirect.ts`
- `src/pages/admin/IndexationDashboard.tsx`
- Migration : table + RLS + pg_cron jobs

**Modifiés**
- `scripts/generate-sitemap.ts` : exclusion des retired
- `src/pages/CategoryPage.tsx`, `src/pages/TagPage.tsx`, `src/pages/CityPage.tsx` : hook redirect
- `src/App.tsx` : route `/admin/indexation`

## Quota GSC

URL Inspection = 2000 req/jour / propriété. Avec 500/jour on tourne chaque URL tous les ~6 jours (3272 URLs / 500 ≈ 6.5 jours). Suffisant pour un signal hebdomadaire.

## Ce qui n'est PAS inclus

- Vrai HTTP 410 (impossible sans SSR — dit plus haut)
- Notification email quand une page est retirée (peut être ajouté après)
- A/B test contenu avant retrait
