// Pure computation of the <head> values emitted by <SEO>. Shared by the React
// component (src/components/SEO.tsx) and the build-time prerender
// (scripts/prerender.ts) so both always produce identical tags.

export const SITE_URL = 'https://pulse-map.live';
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;
export const DEFAULT_IMAGE_ALT = 'PulseMap : où sortir ce soir en France';

export interface HreflangItem {
  lang: string;
  path: string;
}

export interface SeoInput {
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

const cut = (s: string, max: number) => (s.length > max ? s.slice(0, max - 3) + '…' : s);

export function computeSeoHead(p: SeoInput) {
  const image = p.image || DEFAULT_IMAGE;
  const isDefault = image === DEFAULT_IMAGE;
  const url = p.canonical
    ? p.canonical.startsWith('http') ? p.canonical : `${SITE_URL}${p.canonical}`
    : SITE_URL;
  return {
    url,
    title: cut(p.title, 60),
    description: cut(p.description, 160),
    ogTitle: cut(p.ogTitle || p.title, 60),
    ogDescription: cut(p.ogDescription || p.description, 160),
    ogType: p.type === 'event' ? 'article' : (p.type || 'website'),
    image,
    isDefaultImage: isDefault,
    imageWidth: p.imageWidth ?? (isDefault ? 1200 : undefined),
    imageHeight: p.imageHeight ?? (isDefault ? 630 : undefined),
    imageAlt: p.imageAlt ?? (isDefault ? DEFAULT_IMAGE_ALT : undefined),
    noindex: !!p.noindex,
    hreflang: (p.hreflang || []).map((h) => ({ lang: h.lang, href: `${SITE_URL}${h.path}` })),
    jsonLd: p.jsonLd ? (Array.isArray(p.jsonLd) ? p.jsonLd : [p.jsonLd]) : [],
  };
}
