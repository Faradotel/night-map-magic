# Project rules

- IndexNow goes only through the `indexnow-ping` edge function, triggered fire-and-forget at the end of `refresh-events`. Why: one place handles dedup via `indexnow_submitted`, so search engines are not spammed.
- `indexnow-ping` holds a copy of `isEventIndexable` and `eventSlug`. Any change to `src/lib/seo/eventIndexability.ts` or `src/lib/seo/slug.ts` must be mirrored there. Why: edge functions cannot import from `src/`.
