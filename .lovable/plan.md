## Pulse SEO Optimization Plan

Pulse is a Vite SPA, so we'll combine **client-side dynamic metadata** (react-helmet-async) with **build-time prerendering** for key public routes (home, city pages, event pages) so Google sees real HTML. The premium map UI stays untouched — SEO content lives in dedicated routes and a discreet section below the map.

---

### 1. Metadata infrastructure

- Install `react-helmet-async` and wrap `<App />` in `<HelmetProvider>`.
- Create `src/components/SEO.tsx`: reusable component for `<title>`, `<meta description>`, OG, Twitter, canonical, JSON-LD.
- Default site-wide tags (already in `index.html`) become fallbacks.

### 2. New indexable routes

Add React Router routes (no UI disruption to the map experience):

```text
/                       → home (current map)
/villes                 → index of all cities
/villes/:slug           → city landing page (e.g. /villes/grenoble)
/evenements/:slug-:id   → SEO event detail page
/categories/:slug       → category page (concerts, nightlife, festivals…)
```

- City pages: H1 "Événements à {City} ce soir", intro paragraph, list of upcoming events from `cached_events` filtered by city, internal links to event pages, mini-map preview.
- Event pages: full event info, structured data, "Voir sur la carte" CTA back to `/?event={id}`.
- Category pages: aggregated events of that type across France.
- All pages reuse existing components/data fetching; no new business logic.

### 3. Structured data (JSON-LD)

Inject via `<SEO>`:

- **Event** schema on event pages (name, startDate, location.Place, offers, image, eventStatus, eventAttendanceMode).
- **Place** + **LocalBusiness** on city pages.
- **Organization** + **WebSite** with SearchAction on home.
- **BreadcrumbList** on city/event/category pages.

### 4. Crawlability

- Generate `public/sitemap.xml` at build time via a Vite plugin script that queries `cached_events` (anon key) and writes URLs for home, all cities, all events, categories. Re-runs on build.
- Update `public/robots.txt` to add `Sitemap:` directive.
- Add canonical tags via `<SEO>` on every route.
- Add `react-snap` (or simple Puppeteer prerender script) post-build to prerender `/`, `/villes`, `/villes/*`, `/evenements/*` into static HTML so crawlers see content without JS.

### 5. Content sections (elegant, below the map on home)

A collapsible/secondary section under the map (hidden behind a subtle scroll), containing:

- "Sorties populaires ce soir" — list of 6 trending events with links.
- "Meilleures soirées à {detected city}" — local angle.
- Short editorial paragraph per main category.

Styled minimal, dark, integrated into the existing theme — does not interfere with the map-first UX.

### 6. Performance & Core Web Vitals

- Add `loading="lazy"` + `decoding="async"` to all event images.
- Code-split city/event/category pages with `React.lazy`.
- Defer non-critical scripts (impact.com STAT) with `defer`.
- Preload key fonts; add `<link rel="preconnect">` for Supabase + tiles host.
- Memoize heavy map computations already in place; verify no regressions.

### 7. Semantic HTML pass

- Replace top-level `div`s wrapping page content with `<main>`, `<section>`, `<article>`, `<nav>`.
- Single `<h1>` per route, proper `<h2>`/`<h3>` hierarchy.
- Alt text on all images (event name + city).

### 8. Social sharing

- Per-event OG image: use existing `image_url` from `cached_events` when present, fallback to a branded default at `/og-default.jpg`.
- Twitter `summary_large_image` cards.
- OG title/description from event data.

---

### Technical details

- **No SSR framework swap**: staying on Vite + React Router. Prerendering covers SEO; runtime stays SPA.
- **Slug strategy**: `slugify(name) + '-' + shortId` for events; city slug = lowercased ASCII city name. Slugs are derived deterministically so links are stable.
- **Data source**: existing `cached_events` table via the Supabase anon client — no schema changes.
- **Routing**: SPA fallback already handled by Lovable hosting; deep links work.

### Out of scope

- Migrating to Next.js/Remix.
- New backend tables or auth changes.
- AI-generated editorial content (keeping copy hand-written + templated for quality).

### Deliverables

New files: `src/components/SEO.tsx`, `src/pages/CityPage.tsx`, `src/pages/CitiesIndex.tsx`, `src/pages/EventPage.tsx`, `src/pages/CategoryPage.tsx`, `src/lib/seo/slug.ts`, `src/lib/seo/jsonld.ts`, `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`, `public/og-default.jpg`.

Edited: `src/App.tsx` (Helmet provider + new routes + lazy imports), `index.html` (preconnects, defer pixel), `public/robots.txt` (sitemap), `package.json` (build script chain), `vite.config.ts` (post-build hooks).
