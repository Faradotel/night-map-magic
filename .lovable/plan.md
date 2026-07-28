
# Plan : 3 leviers SEO pour dominer "soirée [ville]"

## Levier #1 — Générateur d'intros uniques par ville (Lovable AI)

**Objectif** : Éliminer le "thin/duplicate content" en donnant à chaque page `/sortir-ce-soir/[ville]` et `/categories/soirees/[ville]` un texte éditorial unique de 250-350 mots, écrit par IA (Gemini via Lovable AI Gateway), régénéré périodiquement.

**Backend** :
- Nouvelle table `city_seo_intros` :
  - `city_slug` (PK), `intro_html` (text), `h1` (text), `meta_description` (text), `generated_at`, `model`, `version`
  - GRANT SELECT anon/auth ; INSERT/UPDATE service_role uniquement
- Edge Function `generate-city-intro` :
  - Input : `citySlug` (ou `all` en batch)
  - Récupère depuis `cached_events` : nb events à venir, top 3 genres, top 3 lieux, prochaine grosse soirée
  - Prompt Gemini 3.6 Flash : rédige intro 250-350 mots FR, ton PulseMap (jeune, direct), mentionne quartiers connus de la ville, genres dominants réels, CTA vers la map
  - Stocke en base
- Edge Function `regenerate-all-city-intros` : boucle sur les 115 villes (rate-limited, ~2s entre requêtes), déclenchable via `/admin/indexation`

**Frontend** :
- `CategoryPage.tsx` : fetch `city_seo_intros` par `city_slug`, injecte l'intro sous le H1 (fallback : texte générique actuel si pas encore généré)
- Cache React Query 24h

**Coût estimé** : ~115 requêtes Gemini Flash = quelques centimes de crédits. Régénération mensuelle recommandée.

---

## Levier #2 — Schema Review/Rating sur les events (Rich Snippets)

**Objectif** : Faire apparaître étoiles ⭐ dans les SERP pour les events → +30-40% CTR mesurés.

**Contrainte Google** : les Review/AggregateRating doivent être **réels** (règles anti-fake reviews strictes). Deux options :

**Option A (recommandée — honnête)** : Utiliser les données déjà présentes
- Le schéma `Event` sur `EventPage.tsx` reçoit `offers`, `location`, `performer` mais pas de rating
- Ajouter `aggregateRating` UNIQUEMENT si l'event a des favoris/attendances réels en base :
  - `ratingValue` = calculé depuis un signal réel (ex: ratio favoris/vues, ou moyenne des notes users si on ajoute la feature)
  - `reviewCount` = `favorites_count + attendances_count` (seuil min 5 pour éviter les faux positifs Google)
- Sur les events sans données suffisantes : pas de rating (Google pénalise les faux)

**Option B** : Ajouter une vraie fonctionnalité "noter cette soirée" (1-5 étoiles) — nécessite UI + table `event_ratings` + modération. Plus long mais durable.

**Ma reco** : Option A d'abord (impact immédiat sur events populaires), Option B en itération 2.

**Fichiers** :
- `src/pages/EventPage.tsx` : enrichir le JSON-LD existant
- Nouvelle RPC `get_event_engagement(event_id)` retournant `{favorites, attendances}`

---

## Levier #3 — Meta descriptions dynamiques avec compteur live

**Objectif** : Meta descriptions uniques par page/ville avec données fraîches → meilleur CTR et signal de "fraîcheur" pour Google.

**Format cible** :
- `/sortir-ce-soir/lyon` → `"27 soirées ce soir à Lyon : techno au Sucre, afterwork rue Mercière, rave secrète en périphérie. Carte live des sorties du [DATE]."`
- `/categories/soirees/lyon` → `"142 soirées à venir à Lyon cette semaine : électro, house, techno. Filtre par quartier, ambiance et prix sur la carte PulseMap."`

**Implémentation** :
- `CategoryPage.tsx` : compter les events depuis `cached_events` filtrés par ville + fenêtre temporelle
- Construire meta description via `react-helmet-async` (déjà présent) avec :
  - Nombre d'events (calculé au render)
  - 2-3 exemples de lieux/genres tirés des events réels
  - Date FR du jour (`Europe/Paris`)
- Idem pour title : `"Soirées Lyon ce soir : 27 events en live | PulseMap"`

**Contrainte SPA** : le compteur ne sera visible que par les crawlers exécutant JS (Googlebot ✅). Pour crawlers non-JS : fallback texte générique dans `index.html`.

---

## Ordre d'exécution proposé

1. **Levier #3** en premier (rapide, ~1h) — impact immédiat CTR
2. **Levier #1** ensuite (~2h) — plus gros impact SEO long terme
3. **Levier #2 Option A** en dernier (~1h) — bonus rich snippets

Total : ~4h de dev, tout automatisable et scalable.

## Détails techniques

- **AI** : `google/gemini-3.6-flash` via Lovable AI Gateway (déjà configuré, pas de nouvelle clé)
- **Cache** : React Query côté client (24h), Postgres côté serveur (jusqu'à régénération)
- **Sécurité** : `city_seo_intros` lecture publique, écriture service_role uniquement (via Edge Function)
- **Monitoring** : logs Edge Functions consultables via `/admin/indexation`

## Question avant de coder

Tu veux :
- **(A)** Je fais les 3 leviers d'un coup dans l'ordre 3 → 1 → 2 ?
- **(B)** On commence uniquement par le #1 (intros IA, plus gros levier SEO) et on voit les résultats avant les autres ?
- **(C)** Autre ordre ?
