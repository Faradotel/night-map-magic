# PulseMap

**Carte interactive des soirées, concerts et événements en France.**

Production : [pulse-map.live](https://pulse-map.live)

PulseMap agrège en temps réel les events de 10 sources (Shotgun, Ticketmaster,
Eventbrite, Meetup, InfoConcert, OpenAgenda, Brocabrac, Route des Festivals,
RunTrail, + events créés par des pros) et les affiche sur une carte Leaflet
avec clustering, filtres avancés, check-in, badges, amis, QR pass et mode Live.

## Stack

- **Front** : Vite + React 18 + TypeScript + shadcn/ui + Tailwind
- **Carte** : Leaflet + Leaflet.markercluster (tuiles Carto dark/light)
- **Backend** : Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- **Mobile** : Capacitor 8 (Android builds, iOS prêt à ajouter)
- **PWA** : vite-plugin-pwa avec manifest complet (192/512/maskable)
- **Auth** : email/password + OAuth Google (via `@lovable.dev/cloud-auth-js`)

## Setup local

Requis : Node 18+ (ou Bun), un projet Supabase.

```sh
git clone <repo-url>
cd night-map-magic
npm install
cp .env.example .env   # à créer à partir des VITE_* ci-dessous
npm run dev
```

### Variables d'environnement

| Clé | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase (https://xxx.supabase.co) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | ID du projet (pour Lovable) |
| `VITE_APP_URL` | URL publique (ex. https://pulse-map.live) |

Les clés d'API externes (Ticketmaster, Eventbrite, Meetup…) sont configurées
dans les secrets des Edge Functions Supabase, pas en `.env`.

## Scripts

```sh
npm run dev          # Vite dev server (port 8080)
npm run build        # Build prod web
npm run build:dev    # Build en mode dev (stack trace lisibles)
npm run preview      # Serveur statique sur le build prod
npm run lint         # ESLint
npm run test         # Vitest (une fois)
npm run test:watch   # Vitest en watch
npm run android      # Ouvre le build Android via Capacitor
npm run android:sync # Build web + cap sync vers Android
```

## Architecture

```
src/
├── pages/
│   ├── Index.tsx           # page principale (map + tabs)
│   ├── AuthCallback.tsx    # handler OAuth
│   ├── ResetPassword.tsx
│   └── NotFound.tsx
├── components/
│   ├── EventMap.tsx        # carte Leaflet + clustering + Live Pulse
│   ├── FilterBar.tsx       # filtres (date, prix, genres, vibes, sources)
│   ├── BottomNav.tsx
│   ├── TonightsHotspotsBanner.tsx  # banner events hot + amis
│   ├── FriendsScreen.tsx   # amis + demandes + code d'invitation
│   ├── ProfileScreen.tsx   # profil, badges, pass, préférences
│   ├── AddEventSheet.tsx   # création event (pros)
│   ├── PassViewerScreen.tsx  # QR pass + validation
│   └── ui/                 # composants shadcn/ui
├── hooks/
│   ├── useAuth.tsx         # session Supabase + profil
│   ├── useAttendance.tsx   # check-in local + sync DB
│   ├── useFavorites.ts
│   ├── useHotspots.ts      # top events ce soir / hotspots amis
│   ├── useLiveEvents.ts    # events avec check-ins récents (realtime)
│   ├── useEventPass.ts     # QR pass CRUD + validation
│   ├── useUnlockedBadges.ts
│   └── useOfflineEvents.ts # cache 24h localStorage
├── lib/api/shotgun.ts      # agrégation des 10 sources via edge functions
├── data/mockEvents.ts      # types + fixtures (vide en prod)
└── integrations/supabase/  # client + types générés
supabase/
├── migrations/             # SQL versionné
├── functions/              # 10 edge functions (fetch-*, scrape-*, refresh)
└── config.toml
android/                    # projet Capacitor Android
public/                     # favicon + icônes PWA
```

## Fonctionnalités

- **Carte interactive** — clustering, filtres par source/date/prix/genre/vibe,
  mode "proche de moi" / ville / France entière
- **Live Pulse** — toggle sur la carte qui fait pulser les events où des gens
  check-in en temps réel (realtime Supabase sur `event_attendance`)
- **Tonight's Hotspots** — banner du haut : top events ce soir + events où
  ≥2 amis vont (RPCs `get_tonight_hotspots`, `get_friend_hotspots`)
- **Check-in / Favoris** — local + sync DB quand connecté, notification push
  aux amis via trigger Postgres
- **Amis** — recherche par pseudo, code d'invitation 24h, vue des soirées des
  amis
- **Badges** — 25+ badges déblocables (nombre de sorties, villes, genres…)
- **QR Pass** — upload d'un billet (image + QR), validation côté serveur
  (expiration + one-shot)
- **Création d'event pro** — form multi-steps, upload image, storage bucket
  dédié, policies RLS via `has_role(uid, 'pro')`
- **Notifications** — feed realtime avec marquage lu / tout lu
- **PWA offline-first** — cache localStorage 24h + service worker Workbox
- **Deep linking** — OAuth mobile via scheme `com.nightmap.app://auth`

## Backend Supabase

### Tables principales
- `profiles` — user profiles (username, avatar_url, preferred_city)
- `friendships` / `friend_requests` / `share_codes` — graphe social
- `event_attendance` / `event_favorites` — interactions utilisateur
- `event_passes` — QR passes (+ used_at, valid_until)
- `notifications` / `notification_preferences` — feed realtime
- `cached_events` — events agrégés par les edge functions
- `user_roles` — rôle `admin` / `pro` / `user` (+ fonction `has_role`)

### RPCs
- `get_event_attendance_count(event_id)` — compte des présents
- `get_live_events(since_hours, limit)` — events avec check-ins récents
- `get_tonight_hotspots(limit)` — top events ce soir
- `get_friend_hotspots(min_friends, limit)` — events où plusieurs amis vont
- `validate_event_pass(pass_id)` — valide un pass (statut JSON)
- `has_role(user_id, role)` — vérif RLS
- `are_friends(a, b)` — vérif amitié

### Triggers clés
- `on_auth_user_created` → crée profil + prefs de notif
- `on_friend_request_accepted` → crée la ligne `friendships`
- `on_attendance_created` → notifie tous les amis du check-in

### Edge Functions
`fetch-ticketmaster`, `fetch-eventbrite`, `fetch-meetup`, `fetch-infoconcert`,
`fetch-openagenda`, `fetch-brocabrac`, `fetch-routedesfestivals`,
`fetch-runtrail`, `scrape-shotgun`, `refresh-events` (orchestrateur).

## Déploiement

### Web
Lié à Lovable — `git push` propage automatiquement.
Domaine : `pulse-map.live`.

### Android (plus tard, quand le compte Play Console sera créé)
```sh
npm run android:sync
npx cap open android
# dans Android Studio : Build → Generate Signed Bundle (AAB)
```
Le deep link OAuth est déjà configuré (`com.nightmap.app://auth` dans
`AndroidManifest.xml` + handler dans `App.tsx`).

### iOS (à venir)
```sh
npx cap add ios
npx cap sync
npx cap open ios
```

## Licence

Propriétaire — tous droits réservés.
