export type EventVibe =
  | 'rave'
  | 'chill'
  | 'afterwork'
  | 'cosy'
  | 'concert'
  | 'culture'
  | 'sport'
  // Nouvelles ambiances Pulse
  | 'party'
  | 'nightlife'
  | 'dance'
  | 'family'
  | 'energy';

export type MusicGenre = 'electro' | 'techno' | 'house' | 'pop' | 'rock' | 'indie' | 'r&b' | 'jazz' | 'hip-hop';
export type PriceRange = 'gratuit' | '€1-10' | '€10-20' | '€20+';

// Types d'événements. Volontairement en string ouvert pour accepter les nouveaux
// buckets (nightlife, culture, famille, cinema…) tout en gardant les anciens
// (soirée, club, bar, concert, théâtre, expo, brocante…) le temps de la
// migration des données existantes.
export type EventType =
  // Nouveaux buckets Pulse (priorisés)
  | 'nightlife'
  | 'concert'
  | 'festival'
  | 'spectacle'
  | 'culture'
  | 'sport'
  | 'famille'
  | 'cinema'
  | 'plante'
  | 'autre'
  // Legacy — encore présent en DB, mappé vers les nouveaux au fil du refresh
  | 'soirée'
  | 'club'
  | 'bar'
  | 'afterwork'
  | 'théâtre'
  | 'expo'
  | 'brocante';

export interface NightEvent {
  id: string;
  name: string;
  type: EventType;
  vibe: EventVibe;
  genres: MusicGenre[];
  /** Sous-genre libre (ex: "indie" pour un rock indé, "techno" pour de l'électro). */
  subGenre?: string;
  /** Priorité d'affichage carte (0 = plus haute). Nightlife/Concert/Festival passent devant. */
  priority?: number;
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
  imageColor: string;
  imageUrl?: string;
  isLive?: boolean;
  distance?: number;
  externalAttendees?: number | null;
}

export const mockEvents: NightEvent[] = [];

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
  // Ambiances historiques
  rave: { label: 'Rave', color: 'hsl(315 100% 53%)', emoji: '⚡' },
  chill: { label: 'Chill', color: 'hsl(183 100% 50%)', emoji: '🌊' },
  afterwork: { label: 'Afterwork', color: 'hsl(45 100% 55%)', emoji: '🥂' },
  cosy: { label: 'Cosy', color: 'hsl(25 90% 55%)', emoji: '🕯️' },
  concert: { label: 'Concert', color: 'hsl(275 71% 58%)', emoji: '🎸' },
  culture: { label: 'Culture', color: 'hsl(200 80% 55%)', emoji: '🎭' },
  sport: { label: 'Sport', color: 'hsl(140 70% 45%)', emoji: '⚽' },
  // Nouvelles ambiances Pulse
  party: { label: 'Party', color: 'hsl(330 100% 60%)', emoji: '🎉' },
  nightlife: { label: 'Nightlife', color: 'hsl(280 100% 60%)', emoji: '🌙' },
  dance: { label: 'Dance', color: 'hsl(300 90% 55%)', emoji: '💃' },
  family: { label: 'Famille', color: 'hsl(30 90% 60%)', emoji: '👨‍👩‍👧' },
  energy: { label: 'High Energy', color: 'hsl(0 100% 55%)', emoji: '⚡️' },
};

export const typeConfig: Record<string, { label: string; emoji: string }> = {
  // Nouveaux buckets
  nightlife: { label: 'Nightlife', emoji: '🌙' },
  concert: { label: 'Concert', emoji: '🎸' },
  festival: { label: 'Festival', emoji: '🎪' },
  spectacle: { label: 'Spectacle', emoji: '🎭' },
  culture: { label: 'Culture', emoji: '🖼️' },
  sport: { label: 'Sport', emoji: '⚽' },
  famille: { label: 'Famille', emoji: '👨‍👩‍👧' },
  cinema: { label: 'Cinéma', emoji: '🎬' },
  plante: { label: 'Plantes', emoji: '🌱' },
  autre: { label: 'Autre', emoji: '📍' },
  // Legacy (rendu identique)
  soirée: { label: 'Soirée', emoji: '🎉' },
  club: { label: 'Club', emoji: '🎧' },
  bar: { label: 'Bar', emoji: '🍸' },
  afterwork: { label: 'Afterwork', emoji: '🥂' },
  théâtre: { label: 'Théâtre', emoji: '🎭' },
  expo: { label: 'Expo', emoji: '🎨' },
  brocante: { label: 'Brocante', emoji: '🧺' },
};

/** Priorité d'affichage par type (0 = affiché en premier sur la carte). */
export const TYPE_PRIORITY: Record<string, number> = {
  nightlife: 10,
  soirée: 10,
  club: 10,
  concert: 20,
  festival: 30,
  spectacle: 40,
  théâtre: 40,
  culture: 50,
  expo: 50,
  sport: 60,
  famille: 70,
  cinema: 80,
  plante: 85,
  brocante: 85,
  afterwork: 25,
  bar: 45,
  autre: 90,
};
