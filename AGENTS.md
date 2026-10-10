# Project rules

- IndexNow goes only through the `indexnow-ping` edge function, triggered fire-and-forget at the end of `refresh-events`. Why: one place handles dedup via `indexnow_submitted`, so search engines are not spammed.
- `indexnow-ping` holds a copy of `isEventIndexable` and `eventSlug`. Any change to `src/lib/seo/eventIndexability.ts` or `src/lib/seo/slug.ts` must be mirrored there. Why: edge functions cannot import from `src/`.
- SEO pages are prerendered after `vite build` by `scripts/prerender.ts` (plugin `pulsemap-prerender` in vite.config.ts), from the sitemap URL lists. Why: crawlers without JS get real content; failures never break the build.
- Page titles, descriptions and JSON-LD live in `src/lib/seo/pageMeta.ts` and head tags in `src/lib/seo/seoHead.ts`, used by both React pages and the prerender. Why: static HTML and React output must stay identical.
- Event sources are switched on only through `ENABLED_SOURCES` in `supabase/functions/refresh-events/index.ts`; scraping functions stay deployed but uncalled. Why: legal compliance, only official APIs or open licences are used.
- The impact.com tag is never in `index.html`; `src/lib/impactConsent.ts` loads it only after cookie consent, without `transformLinks`. Why: GDPR consent, and Ticketmaster links must not carry any revenue mechanism.
- Legal identity and contact come only from `src/lib/legal.ts`; `/mentions-legales` redirects to `/terms` while the editor name is empty. Why: no hard-coded or placeholder legal data in production.
- `/sources` content lives in `src/lib/seo/sourcesContent.ts`, shared by the React page and the prerender. Why: static HTML and React output must stay identical.
