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
  reims: 'Reims',
  toulon: 'Toulon',
  'le-havre': 'Le Havre',
  angers: 'Angers',
  dijon: 'Dijon',
  brest: 'Brest',
  nimes: 'Nîmes',
  'clermont-ferrand': 'Clermont-Ferrand',
  'le-mans': 'Le Mans',
  tours: 'Tours',
  limoges: 'Limoges',
  perpignan: 'Perpignan',
  metz: 'Metz',
  besancon: 'Besançon',
  orleans: 'Orléans',
  rouen: 'Rouen',
  mulhouse: 'Mulhouse',
  caen: 'Caen',
  nancy: 'Nancy',
  // Vague 2 — grosses villes / préfectures / stations
  amiens: 'Amiens',
  avignon: 'Avignon',
  poitiers: 'Poitiers',
  'la-rochelle': 'La Rochelle',
  annecy: 'Annecy',
  chambery: 'Chambéry',
  pau: 'Pau',
  bayonne: 'Bayonne',
  biarritz: 'Biarritz',
  valence: 'Valence',
  cannes: 'Cannes',
  antibes: 'Antibes',
  ajaccio: 'Ajaccio',
  bastia: 'Bastia',
  colmar: 'Colmar',
  troyes: 'Troyes',
  bourges: 'Bourges',
  chartres: 'Chartres',
  niort: 'Niort',
  angouleme: 'Angoulême',
  beziers: 'Béziers',
  narbonne: 'Narbonne',
  dunkerque: 'Dunkerque',
  roubaix: 'Roubaix',
  tourcoing: 'Tourcoing',
  lorient: 'Lorient',
  vannes: 'Vannes',
  quimper: 'Quimper',
  'saint-nazaire': 'Saint-Nazaire',
  cherbourg: 'Cherbourg',
  versailles: 'Versailles',
  // Vague 3 — banlieue parisienne + préfectures + villes touristiques
  'boulogne-billancourt': 'Boulogne-Billancourt',
  'saint-denis': 'Saint-Denis',
  montreuil: 'Montreuil',
  argenteuil: 'Argenteuil',
  nanterre: 'Nanterre',
  creteil: 'Créteil',
  courbevoie: 'Courbevoie',
  aubervilliers: 'Aubervilliers',
  'neuilly-sur-seine': 'Neuilly-sur-Seine',
  'issy-les-moulineaux': 'Issy-les-Moulineaux',
  'levallois-perret': 'Levallois-Perret',
  'asnieres-sur-seine': 'Asnières-sur-Seine',
  'rueil-malmaison': 'Rueil-Malmaison',
  antony: 'Antony',
  'ivry-sur-seine': 'Ivry-sur-Seine',
  cholet: 'Cholet',
  'la-roche-sur-yon': 'La Roche-sur-Yon',
  blois: 'Blois',
  'saint-malo': 'Saint-Malo',
  'saint-brieuc': 'Saint-Brieuc',
  arras: 'Arras',
  valenciennes: 'Valenciennes',
  calais: 'Calais',
  'boulogne-sur-mer': 'Boulogne-sur-Mer',
  beauvais: 'Beauvais',
  compiegne: 'Compiègne',
  auxerre: 'Auxerre',
  nevers: 'Nevers',
  vichy: 'Vichy',
  macon: 'Mâcon',
  'chalon-sur-saone': 'Chalon-sur-Saône',
  annemasse: 'Annemasse',
  'thonon-les-bains': 'Thonon-les-Bains',
  chamonix: 'Chamonix',
  menton: 'Menton',
  frejus: 'Fréjus',
  hyeres: 'Hyères',
  martigues: 'Martigues',
  arles: 'Arles',
  carcassonne: 'Carcassonne',
  sete: 'Sète',
  montauban: 'Montauban',
  albi: 'Albi',
  castres: 'Castres',
  tarbes: 'Tarbes',
  perigueux: 'Périgueux',
  'brive-la-gaillarde': 'Brive-la-Gaillarde',
  evreux: 'Évreux',
  rodez: 'Rodez',
  epinal: 'Épinal',
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

export const GENRE_SLUGS: Record<string, { label: string; dbValues: string[]; description: string }> = {
  techno: { label: 'Techno', dbValues: ['techno'], description: 'Soirées techno, raves et clubs underground partout en France.' },
  electro: { label: 'Électro', dbValues: ['electro', 'electronic'], description: 'Soirées électro, DJ sets et clubs branchés en France.' },
  house: { label: 'House', dbValues: ['house'], description: 'Soirées house, deep house et club nights près de chez vous.' },
  rock: { label: 'Rock', dbValues: ['rock'], description: 'Concerts rock, indie rock et lives en France.' },
  pop: { label: 'Pop', dbValues: ['pop'], description: 'Concerts pop et lives grand public partout en France.' },
  indie: { label: 'Indie', dbValues: ['indie'], description: 'Concerts indie, alternative et découvertes musicales.' },
  jazz: { label: 'Jazz', dbValues: ['jazz'], description: 'Concerts jazz, clubs et jam sessions en France.' },
  rnb: { label: 'R&B', dbValues: ['r&b', 'rnb'], description: 'Soirées R&B, hip-hop et concerts urbains en France.' },
};

export const VIBE_SLUGS: Record<string, { label: string; dbValue: string; description: string }> = {
  rave: { label: 'Rave', dbValue: 'rave', description: 'Raves et soirées techno underground partout en France.' },
  chill: { label: 'Chill', dbValue: 'chill', description: 'Sorties chill, lounges et ambiances détendues.' },
  afterwork: { label: 'Afterwork', dbValue: 'afterwork', description: 'Afterworks, 5-à-7 et soirées bureaux en France.' },
  cosy: { label: 'Cosy', dbValue: 'cosy', description: 'Bars cosy et lieux intimistes pour sortir ce soir.' },
  concert: { label: 'Concert live', dbValue: 'concert', description: 'Concerts live tous genres dans toute la France.' },
  culture: { label: 'Culture', dbValue: 'culture', description: 'Sorties culturelles, expos et spectacles.' },
  sport: { label: 'Sport', dbValue: 'sport', description: 'Événements sportifs et matchs en direct.' },
};
