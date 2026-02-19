export type EventVibe = 'rave' | 'chill' | 'afterwork' | 'cosy' | 'concert';
export type MusicGenre = 'electro' | 'techno' | 'house' | 'pop' | 'rock' | 'indie' | 'r&b' | 'jazz';
export type PriceRange = 'gratuit' | '€1-10' | '€10-20' | '€20+';

export interface NightEvent {
  id: string;
  name: string;
  type: 'soirée' | 'club' | 'bar' | 'concert' | 'afterwork';
  vibe: EventVibe;
  genres: MusicGenre[];
  lat: number;
  lng: number;
  address: string;
  city: string;
  startTime: string; // ISO
  endTime?: string;
  priceRange: PriceRange;
  description: string;
  venue: string;
  ticketUrl?: string;
  imageColor: string; // gradient color for placeholder
  isLive?: boolean;
  distance?: number;
}

export const mockEvents: NightEvent[] = [
  {
    id: '1',
    name: 'NUIT ÉLECTRIQUE',
    type: 'club',
    vibe: 'rave',
    genres: ['techno', 'electro'],
    lat: 48.8566,
    lng: 2.3522,
    address: '12 Rue Oberkampf',
    city: 'Paris',
    startTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 8).toISOString(),
    priceRange: '€10-20',
    description: 'Soirée techno dark avec 3 DJs. Immersion sonore totale dans une cave voûtée.',
    venue: 'Le Nouveau Casino',
    ticketUrl: '#',
    imageColor: '#1a0f2e',
    isLive: true,
  },
  {
    id: '2',
    name: 'AFTERWORK ROOFTOP',
    type: 'afterwork',
    vibe: 'afterwork',
    genres: ['house', 'pop'],
    lat: 48.8736,
    lng: 2.295,
    address: '25 Rue de Rivoli',
    city: 'Paris',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    priceRange: 'gratuit',
    description: 'Afterwork avec vue panoramique sur Paris. Cocktails & bonne musique house.',
    venue: 'Perchoir Marais',
    imageColor: '#0f1a2e',
    isLive: false,
  },
  {
    id: '3',
    name: 'INDIE NIGHT LIVE',
    type: 'concert',
    vibe: 'chill',
    genres: ['indie', 'rock'],
    lat: 48.8462,
    lng: 2.3372,
    address: '68 Boulevard de Clichy',
    city: 'Paris',
    startTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    priceRange: '€10-20',
    description: 'Concert live de 3 groupes indie/rock émergents. Ambiance intime et chaleureuse.',
    venue: 'La Cigale',
    ticketUrl: '#',
    imageColor: '#1a1a0a',
    isLive: false,
  },
  {
    id: '4',
    name: 'SOIRÉE JUNGLE',
    type: 'soirée',
    vibe: 'rave',
    genres: ['electro', 'house'],
    lat: 48.8685,
    lng: 2.3413,
    address: '5 Rue Championnet',
    city: 'Paris',
    startTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 12).toISOString(),
    priceRange: '€1-10',
    description: 'Deep house et jungle sounds jusqu\'au petit matin. Déco tropicale immersive.',
    venue: 'Rex Club',
    ticketUrl: '#',
    imageColor: '#0a1a10',
    isLive: false,
  },
  {
    id: '5',
    name: 'JAZZ & COCKTAILS',
    type: 'bar',
    vibe: 'cosy',
    genres: ['jazz'],
    lat: 48.8532,
    lng: 2.3402,
    address: '58 Rue de la Montagne',
    city: 'Paris',
    startTime: new Date(Date.now() + 3600000 * 1).toISOString(),
    priceRange: 'gratuit',
    description: 'Cave jazz vintage avec musiciens live. Signature cocktails & planches apéro.',
    venue: 'Le Caveau de la Huchette',
    imageColor: '#1a100a',
    isLive: true,
  },
  // Lyon events
  {
    id: '6',
    name: 'LYON TECHNO WAREHOUSE',
    type: 'club',
    vibe: 'rave',
    genres: ['techno', 'electro'],
    lat: 45.748,
    lng: 4.8467,
    address: '14 Quai Perrache',
    city: 'Lyon',
    startTime: new Date(Date.now() + 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 10).toISOString(),
    priceRange: '€10-20',
    description: 'Entrepôt industriel transformé en dancefloor. Son Funktion-One, lasers UV.',
    venue: 'Ninkasi Kao',
    ticketUrl: '#',
    imageColor: '#0f0a1a',
    isLive: false,
  },
  {
    id: '7',
    name: 'CHILL & VINYL',
    type: 'bar',
    vibe: 'chill',
    genres: ['r&b', 'indie', 'pop'],
    lat: 45.7576,
    lng: 4.8343,
    address: '9 Rue Mercière',
    city: 'Lyon',
    startTime: new Date(Date.now() + 3600000 * 0.5).toISOString(),
    priceRange: 'gratuit',
    description: 'Bar à vinyles, sélections DJ lounge. L\'endroit parfait pour commencer la soirée.',
    venue: 'Le Périscope',
    imageColor: '#1a0f0a',
    isLive: true,
  },
  // Marseille events
  {
    id: '8',
    name: 'SUNSET ÉLECTRO MED',
    type: 'soirée',
    vibe: 'chill',
    genres: ['house', 'electro'],
    lat: 43.2965,
    lng: 5.3698,
    address: '3 Corniche Kennedy',
    city: 'Marseille',
    startTime: new Date(Date.now() + 3600000 * 1.5).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 7).toISOString(),
    priceRange: '€1-10',
    description: 'Soirée sunset face à la mer Méditerranée. House music & ambiance balnéaire.',
    venue: 'L\'Epuisette Club',
    ticketUrl: '#',
    imageColor: '#0a1020',
    isLive: false,
  },
  {
    id: '9',
    name: 'RAP MARSEILLAIS LIVE',
    type: 'concert',
    vibe: 'rave',
    genres: ['r&b', 'pop'],
    lat: 43.3004,
    lng: 5.3783,
    address: '22 Avenue du Prado',
    city: 'Marseille',
    startTime: new Date(Date.now() + 3600000 * 6).toISOString(),
    priceRange: '€20+',
    description: '3 artistes rap/trap locaux en concert. L\'énergie marseillaise à son max.',
    venue: 'Le Molotov',
    ticketUrl: '#',
    imageColor: '#1a0a0a',
    isLive: false,
  },
  {
    id: '10',
    name: 'DISCO REVIVAL 70S',
    type: 'soirée',
    vibe: 'rave',
    genres: ['pop', 'r&b'],
    lat: 48.862,
    lng: 2.4,
    address: '89 Rue de la Roquette',
    city: 'Paris',
    startTime: new Date(Date.now() + 3600000 * 2.5).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 9).toISOString(),
    priceRange: '€1-10',
    description: 'Soirée disco avec costumes encouragés. DJ sets 70-80s, lights boule à facettes.',
    venue: 'La Bellevilloise',
    imageColor: '#1a1400',
    isLive: false,
  },
];

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
  if (date.toDateString() === tomorrow.toDateString()) return 'Demain';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const vibeConfig: Record<EventVibe, { label: string; color: string; emoji: string }> = {
  rave: { label: 'Rave', color: 'hsl(315 100% 53%)', emoji: '⚡' },
  chill: { label: 'Chill', color: 'hsl(183 100% 50%)', emoji: '🌊' },
  afterwork: { label: 'Afterwork', color: 'hsl(45 100% 55%)', emoji: '🥂' },
  cosy: { label: 'Cosy', color: 'hsl(25 90% 55%)', emoji: '🕯️' },
  concert: { label: 'Concert', color: 'hsl(275 71% 58%)', emoji: '🎸' },
};

export const typeConfig: Record<string, { label: string; emoji: string }> = {
  soirée: { label: 'Soirée', emoji: '🎉' },
  club: { label: 'Club', emoji: '🎧' },
  bar: { label: 'Bar', emoji: '🍸' },
  concert: { label: 'Concert', emoji: '🎸' },
  afterwork: { label: 'Afterwork', emoji: '🥂' },
};
