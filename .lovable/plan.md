# Évaluation : migration vers TanStack Start (rendu serveur)

Aucun code ne sera modifié avant votre accord.

## Constat sur le projet actuel
- Application à page unique (SPA) : Vite 5, react-router (`BrowserRouter`, routes dans `src/App.tsx`), react-helmet-async (`src/components/SEO.tsx`), données lues via Lovable Cloud côté navigateur.
- 26 fichiers de `src/` utilisent `window`, `localStorage` ou `sessionStorage`. Leaflet est dans `src/components/EventMap.tsx`.
- Extras : Capacitor Android (`webDir: 'dist'`), PWA (`vite-plugin-pwa` avec `src/sw.ts`), plugin MCP dans Vite, sitemaps générés au prebuild.

## 1. Faisabilité
C'est réaliste, mais c'est un gros chantier : environ 25 pages et composants principaux à toucher.
- **Routeur** : react-router remplacé par TanStack Router, avec un fichier par route sous `src/routes/` (`index`, `sortir-ce-soir.$slug`, `evenements.$slug`, `categories.$slug`, `categories.$slug.$city`, `genres...`, `ambiances...`, `villes`, `en/nightlife.$slug`, pages légales, admin, auth).
- **Liens et navigation** : `Link`, `useParams`, `useSearchParams` et `Navigate` à remplacer partout.
- **Balises de tête** : react-helmet-async remplacé par la fonction `head()` de chaque route (title, description, canonical, og, twitter, JSON-LD).
- **Données** : chaque page SEO charge ses données côté serveur dans un `loader` avec un client Lovable Cloud sans session (lecture publique de `cached_events` et `city_seo_intros`).
- **Fichiers principaux touchés** : `src/App.tsx`, `src/main.tsx`, `index.html` (remplacé par la route racine), `vite.config.ts`, `src/components/SEO.tsx`, `src/pages/*` (Index, CityPage, EventPage, CategoryPage, TagPage, CitiesIndex, NightlifePage, ResetPassword, AuthCallback, OAuthConsent, admin), `RetiredPageGuard`, `useRetiredPageRedirect`, `useAuth`, `useTheme`, `usePreferredCity`, `useDistanceUnit`, `EventMap`, `SplashScreen`, `CookieConsent`.

## 2. Code navigateur (carte, window, stockage, Capacitor)
- **Leaflet et markercluster** : chargés seulement dans le navigateur (import dynamique dans un composant client), avec un emplacement vide de même taille côté serveur pour éviter que la page saute.
- **localStorage et sessionStorage** : lus dans `useEffect` ou via un utilitaire protégé (`typeof window`), avec une valeur par défaut côté serveur.
  - Le splash (`pulse_splash_shown`), le thème, la ville préférée et l'onboarding sont concernés.
  - Risque de petit décalage visuel au chargement, à traiter page par page.
- **Capacitor** : appels uniquement dans les effets, derrière `Capacitor.isNativePlatform()`.

## 3. Auth Lovable Cloud
- La session reste côté navigateur : les pages publiques sont rendues sans utilisateur, puis le contenu connecté (favoris, amis, badges) s'ajoute dans le navigateur.
- Les pages OAuth, `/auth/callback`, `/reset-password` et `/.lovable/oauth/consent` sont rendues seulement dans le navigateur.
- `previewAuthStorage` et le client généré ne sont pas modifiés ; il faut juste ne jamais les initialiser côté serveur.
- Risque moyen : il faudra retester la connexion Google, la réinitialisation du mot de passe, l'écran de consentement MCP et la connexion sur l'appli Android.

## 4. Appli Android Capacitor
Ce point est bloquant si on ne s'en occupe pas.
- Capacitor embarque un dossier statique (`dist`), et la sortie de TanStack Start n'est plus un simple `index.html`.
- Solution : un build SPA séparé pour Android (même code, rendu navigateur uniquement), par exemple `build:android` vers `dist-android`, et `webDir` pointé dessus.
- Il est faisable, mais à valider dès le début. Sinon l'appli Android casse au prochain `android:sync`.

## 5. PWA
- `vite-plugin-pwa` n'est pas prévu pour TanStack Start.
- Il faudra soit garder `src/sw.ts` compilé à part et servi depuis `public/`, soit retirer temporairement la mise en cache hors ligne.
- Les pages ne doivent plus être servies depuis un `index.html` en cache, sinon le rendu serveur est contourné.
- Risque moyen pour le mode hors ligne (`useOfflineEvents`) et les notifications push (le service worker les reçoit).

## 6. Sitemaps et fichiers statiques
- `robots.txt`, `llms.txt`, `og-default.png` et le fichier de clé IndexNow restent dans `public/` et sont servis tels quels.
- `scripts/generate-sitemap.ts` peut rester en prebuild. Option plus tard : des routes serveur pour les sitemaps, toujours à jour sans republier.
- Aucun impact sur la liste IndexNow ni sur les edge functions.

## 7. Redirections et codes HTTP
- `/villes/:slug`, `/soirees/:slug` et `/rgpd` deviennent de vraies redirections 301 côté serveur (aujourd'hui elles se font dans le navigateur).
- Les événements, villes et tags inconnus renvoient un vrai 404 via `notFound()` dans le loader (aujourd'hui, réponse 200).
- Les pages retirées : lecture de `page_index_status` dans le loader, puis 301 vers la ville parente, ou 410 ou noindex selon votre choix.

## 8. Hébergement Lovable et domaine
- La migration est proposée par Lovable (menu "/" puis "Migrate to TanStack Start"), et la publication bascule sur le pipeline TanStack une fois le build validé.
- Le domaine pulse-map.live reste rattaché au projet ; il sert la nouvelle version à la prochaine publication.
- À vérifier après publication : le rendu serveur répond sur le domaine personnalisé, et les fichiers de `public/` sont bien servis.

## 9. Étapes et points de contrôle
1. Lancer la migration officielle (préanalyse, puis passage au nouveau squelette). Contrôle : le build passe et la carte s'affiche dans l'aperçu.
2. Isoler le code navigateur (carte, stockage, Capacitor, splash). Contrôle : aucune erreur serveur, pas de décalage visuel.
3. Loaders et `head()` pour l'accueil, `/sortir-ce-soir`, `/evenements`, `/categories`, `/villes`. Contrôle : le HTML brut (curl) contient le contenu, les balises et le JSON-LD.
4. Redirections 301, vrais 404, pages retirées. Contrôle : codes HTTP vérifiés avec curl.
5. Auth, PWA et push. Contrôle : connexion Google, mot de passe, notifications.
6. Build Android séparé. Contrôle : l'appli démarre et la connexion fonctionne.
7. Publication, puis tests des aperçus de partage (débogueurs Facebook et X, WhatsApp).

Retour en arrière : annuler le message de migration dans l'historique du chat (prévu par Lovable). Ne pas publier tant que les étapes 1 à 6 ne sont pas validées : le site en ligne reste sur l'ancienne version jusqu'à la publication.

## 10. Risques, effort, coût
- **Élevé** : appli Android (build séparé), PWA, mode hors ligne et push, régressions de navigation sur une app très interactive (Index.tsx fait 36 Ko).
- **Moyen** : auth et OAuth, décalages visuels liés au stockage local, carte Leaflet.
- **Faible** : sitemaps, fichiers statiques, domaine, edge functions.
- **Effort estimé** : 15 à 25 messages, sur les 7 étapes.
- **Coût en crédits** : impossible à chiffrer de façon fiable d'ici, car il dépend de la taille des messages. Ordre de grandeur : nettement plus que l'alternative ci-dessous. Vous pouvez vérifier votre solde avant de lancer.

## 11. Alternative légère : prérendu des pages SEO
Principe : on garde la SPA. Un script au build (ou une edge function à la volée) produit du HTML statique pour les pages SEO (villes tier 1 et 2, catégories, événements du sitemap), avec contenu, balises, JSON-LD et l'image de l'événement.
- **Au build** : `scripts/generate-sitemap.ts` écrit aussi `public/sortir-ce-soir/<slug>/index.html`, etc. Limite : environ 3200 événements, donc un build plus long, et du contenu figé jusqu'à la prochaine publication.
- **À la volée** : impossible sans pouvoir réécrire les requêtes au niveau de l'hébergeur, que Lovable ne permet pas. Seul le prérendu au build est donc applicable.

| | Migration complète | Prérendu au build |
|---|---|---|
| HTML brut avec vrai contenu | Toutes les pages, toujours à jour | Pages SEO, figé à la publication |
| Aperçus de partage des événements | Oui | Oui, pour les événements prérendus |
| Vrais 301 et 404 | Oui | Non, inchangé |
| Temps d'affichage mobile | Meilleur | Meilleur sur les pages prérendues |
| Android, PWA, auth | À refaire et retester | Aucun impact |
| Effort | 15 à 25 messages | 3 à 6 messages |
| Risque | Élevé | Faible |

## Recommandation
Commencer par l'alternative légère (prérendu au build des pages villes, catégories et événements). Elle répond à l'essentiel des objectifs 1 et 2 pour Bing, DuckDuckGo et les aperçus de partage, sans toucher à Android, à la PWA ni à l'auth. Elle coûte une fraction de la migration.

La migration complète reste pertinente plus tard si vous voulez de vrais codes HTTP et un contenu toujours à jour sans republier. Dans ce cas, il faut d'abord régler le build Android séparé.

## Détails techniques à vérifier avant l'alternative
- Taille de `dist` avec environ 3200 pages, et temps de build acceptable sur Lovable.
- Le fichier HTML prérendu doit charger le même bundle React, qui reprend ensuite la main dans le navigateur.
- Le service worker ne doit pas remplacer les pages prérendues par l'`index.html` en cache.
