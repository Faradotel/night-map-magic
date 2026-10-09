# Project rules

- IndexNow goes only through the `indexnow-ping` edge function, triggered fire-and-forget at the end of `refresh-events`. Why: one place handles dedup via `indexnow_submitted`, so search engines are not spammed.
- `indexnow-ping` holds a copy of `isEventIndexable` and `eventSlug`. Any change to `src/lib/seo/eventIndexability.ts` or `src/lib/seo/slug.ts` must be mirrored there. Why: edge functions cannot import from `src/`.
- SEO pages are prerendered after `vite build` by `scripts/prerender.ts` (plugin `pulsemap-prerender` in vite.config.ts), from the sitemap URL lists. Why: crawlers without JS get real content; failures never break the build.
- Page titles, descriptions and JSON-LD live in `src/lib/seo/pageMeta.ts` and head tags in `src/lib/seo/seoHead.ts`, used by both React pages and the prerender. Why: static HTML and React output must stay identical.
