import { Helmet } from 'react-helmet-async';

interface HreflangItem {
  lang: string;
  path: string;
}

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  type?: 'website' | 'article' | 'event';
  jsonLd?: object | object[];
  noindex?: boolean;
  hreflang?: HreflangItem[];
}

const SITE_URL = 'https://pulse-map.live';
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`;

export function SEO({
  title,
  description,
  ogTitle,
  ogDescription,
  canonical,
  image = DEFAULT_IMAGE,
  imageWidth,
  imageHeight,
  imageAlt,
  type = 'website',
  jsonLd,
  noindex,
  hreflang,
}: SEOProps) {
  const url = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${SITE_URL}${canonical}`
    : SITE_URL;

  const fullTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const fullDesc = description.length > 160 ? description.slice(0, 157) + '…' : description;
  const ogT = (ogTitle || title).length > 60 ? (ogTitle || title).slice(0, 57) + '…' : (ogTitle || title);
  const ogD = (ogDescription || description).length > 160 ? (ogDescription || description).slice(0, 157) + '…' : (ogDescription || description);
  const ogType = type === 'event' ? 'article' : type;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:title" content={ogT} />
      <meta property="og:description" content={ogD} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      {imageWidth && <meta property="og:image:width" content={String(imageWidth)} />}
      {imageHeight && <meta property="og:image:height" content={String(imageHeight)} />}
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:site_name" content="PulseMap" />
      <meta property="og:locale" content="fr_FR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={image} />

      {hreflang?.map((h) => (
        <link key={h.lang} rel="alternate" hrefLang={h.lang} href={`${SITE_URL}${h.path}`} />
      ))}

      {ldArray.map((ld, i) => (
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
