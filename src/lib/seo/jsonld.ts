import { SITE } from '@/components/SEO';

const LOGO_PULSE = `${SITE.url}/icon-512.png`;

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PulseMap',
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_PULSE,
      width: 512,
      height: 512,
      caption: 'PulseMap logo',
    },
    sameAs: [],
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PulseMap',
    url: SITE.url,
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE.url}${it.url}`,
    })),
  };
}

interface EventLdInput {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime?: string;
  venue: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  ticketUrl?: string;
  priceRange?: string;
}

export function eventLd(e: EventLdInput, canonical: string) {
  const offerPrice =
    e.priceRange === 'gratuit' ? '0'
    : e.priceRange === '€1-10' ? '5'
    : e.priceRange === '€10-20' ? '15'
    : e.priceRange === '€20+' ? '25' : '0';

  // endDate: si absent, on prend startTime + 3h (par défaut pour un événement)
  const endDate = e.endTime || (() => {
    const d = new Date(e.startTime);
    d.setHours(d.getHours() + 3);
    return d.toISOString();
  })();

  // validFrom: les billets sont valides dès maintenant (ou la date de création de l'événement)
  const validFrom = new Date().toISOString();

  const canonicalUrl = canonical.startsWith('http') ? canonical : `${SITE.url}${canonical}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    description: e.description?.slice(0, 500) || `${e.name} — ${e.venue}, ${e.city}`,
    startDate: e.startTime,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: e.imageUrl ? [e.imageUrl] : [`${SITE.url}/icon-512.png`],
    url: canonicalUrl,
    location: {
      '@type': 'Place',
      name: e.venue,
      address: {
        '@type': 'PostalAddress',
        streetAddress: e.address,
        addressLocality: e.city,
        addressCountry: 'FR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: e.lat,
        longitude: e.lng,
      },
    },
    performer: {
      '@type': 'PerformingGroup',
      name: e.venue || e.name,
    },
    offers: {
      '@type': 'Offer',
      name: 'Billet',
      price: offerPrice,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: e.ticketUrl || canonicalUrl,
      validFrom,
    },
    organizer: {
      '@type': 'Organization',
      name: 'PulseMap',
      url: SITE.url,
    },
  };
}

export function placeLd(city: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: city,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'FR',
    },
  };
}
