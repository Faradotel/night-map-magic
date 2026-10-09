import { Helmet } from 'react-helmet-async';
import { computeSeoHead, SITE_URL, DEFAULT_IMAGE, type SeoInput } from '@/lib/seo/seoHead';

// Head values are computed in src/lib/seo/seoHead.ts, shared with the
// build-time prerender (scripts/prerender.ts).
export function SEO(props: SeoInput) {
  const h = computeSeoHead(props);

  return (
    <Helmet>
      <title>{h.title}</title>
      <meta name="description" content={h.description} />
      <link rel="canonical" href={h.url} />
      {h.noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:title" content={h.ogTitle} />
      <meta property="og:description" content={h.ogDescription} />
      <meta property="og:type" content={h.ogType} />
      <meta property="og:url" content={h.url} />
      <meta property="og:image" content={h.image} />
      <meta property="og:image:secure_url" content={h.image} />
      {h.isDefaultImage && <meta property="og:image:type" content="image/png" />}
      {h.imageWidth && <meta property="og:image:width" content={String(h.imageWidth)} />}
      {h.imageHeight && <meta property="og:image:height" content={String(h.imageHeight)} />}
      {h.imageAlt && <meta property="og:image:alt" content={h.imageAlt} />}
      <meta property="og:site_name" content="PulseMap" />
      <meta property="og:locale" content="fr_FR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={h.ogTitle} />
      <meta name="twitter:description" content={h.ogDescription} />
      <meta name="twitter:image" content={h.image} />
      {h.imageAlt && <meta name="twitter:image:alt" content={h.imageAlt} />}

      {h.hreflang.map((x) => (
        <link key={x.lang} rel="alternate" hrefLang={x.lang} href={x.href} />
      ))}

      {h.jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}

export const SITE = {
  url: SITE_URL,
  name: 'PulseMap',
  defaultImage: DEFAULT_IMAGE,
};
