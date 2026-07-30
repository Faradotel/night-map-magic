## Où tu en es réellement (données Semrush, base FR)

| Requête | Position | Volume | Page qui ranke |
|---|---|---|---|
| concert à lille ce soir | 15 | 880/mo | /categories/concerts/lille |
| soirée grenoble | 12 | 210/mo | /sortir-ce-soir/grenoble |
| soirée lorient ce soir | 11 | 170/mo | /sortir-ce-soir/lorient |
| ce soir à grenoble | 10 | 90/mo | /sortir-ce-soir/grenoble |
| sortir à grenoble | 33 | 480/mo | /sortir-ce-soir/grenoble |
| soirée toulon | 40 **et** 64 | 140/mo | /genres/pop/toulon **et** /genres/house/toulon |
| soirée hyères ce soir | 20 **et** 28 | 260/mo | /ambiances/culture/hyeres **et** /categories/culture/hyeres |
| sortir sur bordeaux ce soir | 19 | 140/mo | /villes/bordeaux |

32 mots-clés positionnés, ~2 visites/mois estimées. La bonne nouvelle : tu es déjà en position 10-20 sur plusieurs villes — c'est le seuil le plus rapide à franchir. Les trois blocages visibles dans ces données sont précis, pas génériques.

## Diagnostic

**1. Cannibalisation.** Deux URLs différentes se disputent la même requête (« soirée toulon » : /genres/pop et /genres/house ; « soirée hyères ce soir » : /ambiances/culture et /categories/culture). Google dilue le signal entre les deux et n'en classe aucune correctement. C'est ce qui explique les positions 40 et 64 sur Toulon alors que Grenoble est en 12.

**2. Mauvaise page cible.** « soirée toulon » devrait être servi par /sortir-ce-soir/toulon, pas par une page de genre musical. « sortir sur bordeaux ce soir » ranke encore sur /villes/bordeaux, une URL redirigée.

**3. Pas assez de contenu unique par ville.** Les pages qui rankent le mieux (Grenoble) sont celles avec le plus d'événements réels. Les pages en position 20-40 sont des pages à contenu mince du point de vue de Google.

## Ce que je propose de faire

**Étape 1 — Lancer le scan SEO** pour vérifier l'hygiène technique (titres, canonicals, balises) sur l'état actuel du site. Environ une minute.

**Étape 2 — Résoudre la cannibalisation.** Faire pointer les pages `/genres/*/[ville]` et `/ambiances/*/[ville]` en canonical vers `/sortir-ce-soir/[ville]` quand elles ont moins de N événements réellement taggés. Une page de genre ne mérite sa propre URL indexable que si elle a un contenu propre substantiel. Ça concentre l'autorité sur une seule page par ville.

**Étape 3 — Recibler les requêtes « soirée [ville] ».** Retravailler le H1, le titre et l'intro de `/sortir-ce-soir/[ville]` pour couvrir explicitement les variantes qui ont du volume : « soirée [ville] », « sortir à [ville] », « [ville] ce soir ». Aujourd'hui la page rankera sur l'une mais pas les autres (Grenoble : 12 sur « soirée grenoble », 33 sur « sortir à grenoble » — même page, écart de 20 positions).

**Étape 4 — Densifier les 15-20 villes les plus proches de la page 1.** Sur ces villes uniquement (pas les 115) : intro éditoriale unique générée, liste des lieux récurrents nommés, FAQ ciblant les requêtes réelles. Une page dense sur 20 villes bat 115 pages minces.

**Étape 5 — Nettoyer les URLs héritées.** Vérifier que `/villes/[slug]` redirige bien et n'est plus dans le sitemap, pour que Bordeaux bascule sur la bonne URL.

## Détails techniques

- Cannibalisation : logique de canonical conditionnelle dans `TagPage.tsx`, basée sur le comptage d'événements taggés déjà disponible côté page.
- Ciblage requêtes : `CityPage.tsx` et `CategoryPage.tsx` (H1, title, meta, intro).
- Densification : réutiliser la fonction `generate-city-intro` existante, restreinte aux villes prioritaires.
- Sitemap : `scripts/generate-sitemap.ts` filtre déjà les combos vides — à vérifier pour `/villes/*`.

## Attentes réalistes

Google met 4 à 8 semaines à recrawler et réévaluer. Les villes déjà en position 10-15 (Grenoble, Lorient, Lille) sont les plus susceptibles de passer en page 1 sur ce cycle. Être « premier partout en France » n'est pas atteignable à court terme face à des sites établis — la stratégie gagnante est de dominer d'abord 15-20 villes, ce qui construit l'autorité pour les suivantes.

Source des données : Semrush, base France.
