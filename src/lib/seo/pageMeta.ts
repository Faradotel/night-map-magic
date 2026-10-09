// Pure builders for page title / description / JSON-LD. Shared by the React
// pages (CityPage, CategoryPage, EventPage, CitiesIndex) and the build-time
// prerender (scripts/prerender.ts) so the static HTML matches what React emits.
import { breadcrumbLd, eventLd, placeLd, organizationLd, websiteLd } from './jsonld';
import { eventSlug } from './slug';
import { SITE_URL } from './seoHead';

export interface CityEventInput {
  id: string; name: string; city: string; venue: string; address: string;
  lat: number; lng: number; start_time: string; end_time: string | null;
  description: string; image_url: string | null; ticket_url: string | null; price_range: string;
}

export interface SeoIntroInput { h1: string; intro_html: string; meta_description: string }

export function buildCityMeta(args: {
  slug: string; cityName: string; events: CityEventInput[]; aiIntro: SeoIntroInput | null; isSortirRoute: boolean;
}) {
  const { cityName, events, aiIntro, isSortirRoute } = args;
  const slug = args.slug.toLowerCase();
  const canonical = `/sortir-ce-soir/${slug}`;

  const topVenues = [...new Set(events.map(e => e.venue).filter(Boolean))].slice(0, 8);
  const eventsCount = events.length;
  const eventsCountLabel = eventsCount === 60 ? '60+' : String(eventsCount);

  const title = isSortirRoute
    ? `Soirée ${cityName} : sortir ce soir à ${cityName}`
    : `Sortir ce soir à ${cityName} : que faire ? | PulseMap`;
  const description = aiIntro?.meta_description
    ? aiIntro.meta_description
    : eventsCount > 0
    ? `${eventsCount} sorties à ${cityName} ce soir et dans les jours à venir : soirées, concerts, clubs et bars${topVenues.length ? ` (${topVenues.slice(0, 2).join(', ')})` : ''}. Carte live, gratuit sans inscription.`
    : `Où sortir ce soir à ${cityName} ? Carte temps réel des concerts, soirées, clubs, festivals et bars animés ouverts ce soir à ${cityName}. Gratuit, sans inscription.`;

  const ogTitle = `Soirée ${cityName} — Où sortir ce soir à ${cityName} ?`;
  const ogDescription = `Tu cherches où sortir ce soir à ${cityName} ? PulseMap te montre tous les événements live ce soir sur une carte interactive. Gratuit, sans inscription.`;

  const faqs = [
    {
      q: `Où sortir ce soir à ${cityName} ?`,
      a: `Pour sortir ce soir à ${cityName}, PulseMap affiche en temps réel tous les concerts, soirées, clubs, bars animés et festivals ouverts ce soir à ${cityName} sur une carte interactive. Filtre par type, distance ou horaire pour trouver la sortie idéale.`,
    },
    {
      q: `Quelle soirée à ${cityName} ce soir ?`,
      a: topVenues.length
        ? `Ce soir à ${cityName}, des soirées sont programmées notamment à ${topVenues.slice(0, 4).join(', ')}. PulseMap liste ${eventsCount} sorties à venir à ${cityName} avec horaires, adresse exacte et billetterie.`
        : `PulseMap liste en direct toutes les soirées, clubs et DJ sets programmés à ${cityName}, avec horaires, adresse exacte et lien billetterie.`,
    },
    {
      q: `Que faire ce soir à ${cityName} ?`,
      a: `Ce soir à ${cityName}, tu peux profiter de concerts live, soirées électro et techno, clubs, afterworks, festivals, expos nocturnes ou simplement un bar animé. Tous les événements sont géolocalisés et mis à jour en continu sur PulseMap.`,
    },
    {
      q: `Comment trouver une soirée ce soir à ${cityName} ?`,
      a: `Ouvre PulseMap, sélectionne ${cityName} et active le filtre « ce soir ». La carte affiche immédiatement toutes les soirées disponibles ce soir à ${cityName} avec les horaires, le lieu et le lien vers la billetterie.`,
    },
    {
      q: `PulseMap est-il gratuit pour découvrir les sorties à ${cityName} ?`,
      a: `Oui, PulseMap est 100 % gratuit. Tu peux consulter la carte des sorties à ${cityName} sans inscription, et créer un compte uniquement pour les fonctionnalités sociales (amis, check-ins, badges).`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const ld: object[] = [
    placeLd(cityName),
    breadcrumbLd([
      { name: 'Accueil', url: '/' },
      { name: 'Villes', url: '/villes' },
      { name: cityName, url: canonical },
    ]),
    faqLd,
  ];
  events.slice(0, 20).forEach(e =>
    ld.push(eventLd({
      id: e.id,
      name: e.name,
      description: e.description,
      startTime: e.start_time,
      endTime: e.end_time || undefined,
      venue: e.venue,
      address: e.address,
      city: e.city,
      lat: e.lat,
      lng: e.lng,
      imageUrl: e.image_url || undefined,
      ticketUrl: e.ticket_url || undefined,
      priceRange: e.price_range,
    }, `/evenements/${eventSlug(e.name, e.id)}`))
  );

  const hreflang = [
    { lang: 'fr', path: canonical },
    { lang: 'en', path: `/en/nightlife/${slug}` },
    { lang: 'x-default', path: canonical },
  ];

  return { canonical, topVenues, eventsCount, eventsCountLabel, title, description, ogTitle, ogDescription, faqs, ld, hreflang };
}

export interface CategoryEventInput { id: string; name: string; venue: string }

export function buildCategoryMeta(args: {
  slug: string;
  cat: { label: string; description: string };
  citySlug?: string;
  cityName?: string;
  events: CategoryEventInput[];
  aiIntro: SeoIntroInput | null;
  loading: boolean;
}) {
  const { cat, citySlug, cityName, events, aiIntro, loading } = args;
  const slug = args.slug.toLowerCase();
  const canonical = cityName ? `/categories/${slug}/${citySlug}` : `/categories/${slug}`;
  const labelLower = cat.label.toLowerCase();
  const singular = cat.label.replace(/s$/, '').toLowerCase();
  const isSoirees = slug === 'soirees';

  const titleCount = cityName && events.length > 0 ? ` : ${events.length} events live` : '';
  const title = isSoirees
    ? (cityName
        ? `Soirée ${cityName} ce soir${titleCount} | PulseMap`
        : `Soirée ce soir en France : où sortir ? Clubs, DJ & bars`)
    : (cityName
        ? `${cat.label} ${cityName} ce soir${titleCount} | PulseMap`
        : `${cat.label} ce soir en France — agenda live | PulseMap`);

  const eventsCount = events.length;
  const genericMeta = isSoirees
    ? (cityName
        ? `Soirée ${cityName} ce soir : toutes les soirées, clubs, DJ sets et bars animés à ${cityName} sur une carte temps réel. Mis à jour en direct, gratuit, sans inscription.`
        : `Où sortir ce soir ? Toutes les soirées en France ce soir : clubs, DJ sets, techno, électro, afterworks et bars animés sur une carte temps réel. Gratuit, sans inscription.`)
    : (cityName
        ? `Tous les ${labelLower} ce soir à ${cityName} : carte temps réel, horaires, lieux et billetterie. Gratuit, sans inscription.`
        : `${cat.description} Carte temps réel des ${labelLower} ce soir partout en France. Gratuit, sans inscription.`);

  const description = (() => {
    if (aiIntro?.meta_description) return aiIntro.meta_description;
    if (!cityName || loading) return genericMeta;
    const sampleVenues = [...new Set(events.slice(0, 6).map(e => e.venue).filter(Boolean))].slice(0, 2);
    if (isSoirees && eventsCount > 0) {
      const venuePart = sampleVenues.length ? ` : ${sampleVenues.join(', ')}` : '';
      return `${eventsCount} soirée${eventsCount > 1 ? 's' : ''} à ${cityName} ce soir et dans les jours à venir${venuePart}. Carte live PulseMap, gratuit sans inscription.`.slice(0, 200);
    }
    if (eventsCount > 0) {
      return `${eventsCount} ${labelLower} à ${cityName} à venir. Carte temps réel, horaires, lieux et billetterie sur PulseMap. Gratuit, sans inscription.`.slice(0, 200);
    }
    return genericMeta;
  })();

  const h1 = aiIntro?.h1 || (isSoirees
    ? (cityName
        ? `Soirée ${cityName} — Que faire ce soir à ${cityName} ?`
        : `Soirée ce soir en France : où sortir ?`)
    : (cityName
        ? `${cat.label} ${cityName} ce soir`
        : `${cat.label} ce soir en France`));

  const faqs = isSoirees && cityName ? [
    {
      q: `Où sortir ce soir à ${cityName} ?`,
      a: `Pour trouver où sortir ce soir à ${cityName}, PulseMap affiche en direct toutes les soirées, clubs, DJ sets, afterworks et bars animés ouverts ce soir à ${cityName} sur une carte interactive — avec horaires, lieux et billetterie.`,
    },
    {
      q: `Quelles soirées ce soir à ${cityName} ?`,
      a: `Ce soir à ${cityName}, tu trouveras des soirées techno, électro, house, hip-hop, généralistes, afterworks et clubs. PulseMap regroupe tous les events actifs ce soir à ${cityName} en un coup d'œil.`,
    },
    {
      q: `Comment trouver une soirée près de moi à ${cityName} ?`,
      a: `Ouvre PulseMap, active la catégorie « Soirées & Clubs », centre la carte sur ${cityName} : toutes les soirées ${cityName} apparaissent géolocalisées, triées par distance et horaire.`,
    },
    {
      q: `Y a-t-il une soirée ${cityName} ce week-end ?`,
      a: `Oui. Sélectionne la catégorie « Soirées & Clubs » sur PulseMap et filtre ${cityName} pour voir toutes les soirées ${cityName} du vendredi au dimanche, mises à jour en temps réel.`,
    },
  ] : cityName ? [
    {
      q: `Où trouver un ${singular} ce soir à ${cityName} ?`,
      a: `PulseMap affiche en direct tous les ${labelLower} qui ont lieu ce soir à ${cityName} sur une carte interactive. Horaires, lieux exacts et liens de billetterie inclus.`,
    },
    {
      q: `Y a-t-il des ${labelLower} ce week-end à ${cityName} ?`,
      a: `Oui. Activez la catégorie « ${cat.label} » sur PulseMap et filtrez sur ${cityName} pour voir tous les ${labelLower} disponibles ce week-end avec horaires et lieux.`,
    },
    {
      q: `Comment voir les ${labelLower} à ${cityName} sur une carte ?`,
      a: `Ouvrez la carte PulseMap centrée sur ${cityName} : tous les ${labelLower} apparaissent géolocalisés en temps réel. Cliquez sur un marqueur pour les détails.`,
    },
  ] : [
    {
      q: `Où trouver des ${labelLower} ce soir en France ?`,
      a: `PulseMap référence en direct tous les ${labelLower} qui ont lieu ce soir partout en France sur une carte interactive. Filtrez par ville, distance ou horaire pour trouver l'événement idéal.`,
    },
    {
      q: `Comment savoir s'il y a des ${labelLower} ce week-end près de chez moi ?`,
      a: `Ouvrez PulseMap, activez la catégorie « ${cat.label} » et la carte affiche immédiatement tous les ${labelLower} disponibles autour de vous avec horaires, lieux et billetterie.`,
    },
    {
      q: `PulseMap est-il gratuit pour consulter les ${labelLower} ?`,
      a: `Oui, PulseMap est 100 % gratuit. Vous pouvez consulter tous les ${labelLower} référencés sans inscription.`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const itemListLd = events.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cityName ? `${cat.label} à ${cityName}` : `${cat.label} en France`,
    numberOfItems: events.length,
    itemListElement: events.slice(0, 20).map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/evenements/${eventSlug(e.name, e.id)}`,
      name: e.name,
    })),
  } : null;

  const breadcrumbs = cityName
    ? [
        { name: 'Accueil', url: '/' },
        { name: 'Villes', url: '/villes' },
        { name: cityName, url: `/sortir-ce-soir/${citySlug}` },
        { name: cat.label, url: canonical },
      ]
    : [
        { name: 'Accueil', url: '/' },
        { name: 'Villes', url: '/villes' },
        { name: cat.label, url: canonical },
      ];

  const jsonLd = itemListLd ? [breadcrumbLd(breadcrumbs), faqLd, itemListLd] : [breadcrumbLd(breadcrumbs), faqLd];
  const emptyCityPage = !!cityName && !loading && events.length === 0;

  return { canonical, labelLower, singular, isSoirees, title, eventsCount, description, h1, faqs, faqLd, itemListLd, breadcrumbs, jsonLd, emptyCityPage };
}

export function buildEventMeta(args: {
  slug: string;
  event: CityEventInput;
  engagement: { favorites: number; attendances: number };
}) {
  const { slug, event, engagement } = args;
  const canonical = `/evenements/${slug}`;
  const dateLabel = new Date(event.start_time).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeLabel = new Date(event.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const cityLower = event.city.toLowerCase();

  const title = `${event.name} — ${event.city}, ${dateLabel} | PulseMap`;
  const description = (event.description || `${event.name} à ${event.venue}, ${event.city} le ${dateLabel} à ${timeLabel}. Sortir ce soir à ${event.city} avec PulseMap : infos, lieu et billetterie.`).slice(0, 200);

  const engagementTotal = engagement.favorites + engagement.attendances;
  const aggregateRating = engagementTotal >= 5
    ? {
        '@type': 'AggregateRating',
        ratingValue: Math.min(4.9, 4.2 + Math.log10(engagementTotal) / 3).toFixed(1),
        reviewCount: engagementTotal,
        bestRating: '5',
        worstRating: '1',
      }
    : null;

  const baseEventLd = eventLd({
    id: event.id,
    name: event.name,
    description: event.description,
    startTime: event.start_time,
    endTime: event.end_time || undefined,
    venue: event.venue,
    address: event.address,
    city: event.city,
    lat: event.lat,
    lng: event.lng,
    imageUrl: event.image_url || undefined,
    ticketUrl: event.ticket_url || undefined,
    priceRange: event.price_range,
  }, canonical);

  const ld = [
    aggregateRating ? { ...baseEventLd, aggregateRating } : baseEventLd,
    breadcrumbLd([
      { name: 'Accueil', url: '/' },
      { name: `Sortir à ${event.city}`, url: `/sortir-ce-soir/${cityLower}` },
      { name: event.name, url: canonical },
    ]),
  ];

  return { canonical, dateLabel, timeLabel, cityLower, title, description, ld };
}

export const CITIES_INDEX_META = {
  title: 'Où sortir ce soir en France ? Villes & sorties | PulseMap',
  description: 'Où sortir ce soir en France ? Découvre les soirées, concerts, festivals et bars animés en direct dans toutes les grandes villes : Paris, Lyon, Marseille, Toulouse, Grenoble…',
  canonical: '/villes',
  h1: 'Où sortir ce soir en France ?',
  intro: 'PulseMap référence en temps réel les soirées, concerts, festivals, bars animés et événements culturels qui se passent autour de vous, partout en France. Sélectionnez votre ville pour voir où sortir ce soir.',
  jsonLd: () => [
    organizationLd(),
    websiteLd(),
    breadcrumbLd([
      { name: 'Accueil', url: '/' },
      { name: 'Villes', url: '/villes' },
    ]),
  ],
};
