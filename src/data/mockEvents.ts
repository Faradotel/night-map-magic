export type EventVibe = 'rave' | 'chill' | 'afterwork' | 'cosy' | 'concert' | 'culture' | 'sport';
export type MusicGenre = 'electro' | 'techno' | 'house' | 'pop' | 'rock' | 'indie' | 'r&b' | 'jazz';
export type PriceRange = 'gratuit' | '€1-10' | '€10-20' | '€20+';

export interface NightEvent {
  id: string;
  name: string;
  type: 'soirée' | 'club' | 'bar' | 'concert' | 'afterwork' | 'sport' | 'théâtre' | 'expo' | 'festival' | 'spectacle';
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
  rave: { label: 'Rave', color: 'hsl(315 100% 53%)', emoji: '⚡' },
  chill: { label: 'Chill', color: 'hsl(183 100% 50%)', emoji: '🌊' },
  afterwork: { label: 'Afterwork', color: 'hsl(45 100% 55%)', emoji: '🥂' },
  cosy: { label: 'Cosy', color: 'hsl(25 90% 55%)', emoji: '🕯️' },
  concert: { label: 'Concert', color: 'hsl(275 71% 58%)', emoji: '🎸' },
  culture: { label: 'Culture', color: 'hsl(200 80% 55%)', emoji: '🎭' },
  sport: { label: 'Sport', color: 'hsl(140 70% 45%)', emoji: '⚽' },
};

export const typeConfig: Record<string, { label: string; emoji: string }> = {
  soirée: { label: 'Soirée', emoji: '🎉' },
  club: { label: 'Club', emoji: '🎧' },
  bar: { label: 'Bar', emoji: '🍸' },
  concert: { label: 'Concert', emoji: '🎸' },
  afterwork: { label: 'Afterwork', emoji: '🥂' },
  sport: { label: 'Sport', emoji: '⚽' },
  théâtre: { label: 'Théâtre', emoji: '🎭' },
  expo: { label: 'Expo', emoji: '🎨' },
  festival: { label: 'Festival', emoji: '🎪' },
  spectacle: { label: 'Spectacle', emoji: '🎤' },
};
