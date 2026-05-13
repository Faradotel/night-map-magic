export function slugify(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'event';
}

export function eventSlug(name: string, id: string): string {
  return `${slugify(name)}-${id}`;
}

export function parseEventSlug(slug: string): string {
  // Returns the id portion (everything after the LAST occurrence that looks like an id segment)
  // Our IDs include prefixes like "shotgun-", "tm-", "eb-" etc., so find that prefix.
  const m = slug.match(/(shotgun|tm|eb|mu|ic|bb|rt|oa)-[^/]+$/);
  return m ? m[0] : slug;
}

export const CITY_SLUGS: Record<string, string> = {
  paris: 'Paris',
  lyon: 'Lyon',
  marseille: 'Marseille',
  toulouse: 'Toulouse',
  nice: 'Nice',
  nantes: 'Nantes',
  bordeaux: 'Bordeaux',
  grenoble: 'Grenoble',
  lille: 'Lille',
  strasbourg: 'Strasbourg',
  rennes: 'Rennes',
  montpellier: 'Montpellier',
  'aix-en-provence': 'Aix-en-Provence',
  'saint-etienne': 'Saint-Étienne',
  villeurbanne: 'Villeurbanne',
};

export const CATEGORY_SLUGS: Record<string, { label: string; types: string[]; description: string }> = {
  concerts: {
    label: 'Concerts',
    types: ['concert'],
    description: 'Tous les concerts live à venir près de chez vous, en France.',
  },
  soirees: {
    label: 'Soirées & Clubs',
    types: ['soirée', 'club'],
    description: 'Les meilleures soirées et clubs ouverts ce soir partout en France.',
  },
  festivals: {
    label: 'Festivals',
    types: ['festival'],
    description: 'Festivals de musique, culture et arts vivants à venir en France.',
  },
  bars: {
    label: 'Bars animés',
    types: ['bar', 'afterwork'],
    description: 'Bars animés et afterworks pour sortir ce soir près de chez vous.',
  },
  sport: {
    label: 'Sport',
    types: ['sport'],
    description: 'Événements sportifs en direct, courses, matchs et tournois.',
  },
  culture: {
    label: 'Culture',
    types: ['théâtre', 'expo', 'spectacle'],
    description: 'Théâtre, expositions et spectacles vivants partout en France.',
  },
  brocantes: {
    label: 'Brocantes & Vide-greniers',
    types: ['brocante'],
    description: 'Brocantes, vide-greniers et puces ce week-end en France.',
  },
};
