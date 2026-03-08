import { EventVibe, MusicGenre, NightEvent } from '@/data/mockEvents';

export interface EventFormData {
  name: string;
  date: string;
  time: string;
  type: NightEvent['type'];
  vibe: EventVibe;
  genres: MusicGenre[];
  address: string;
  venue: string;
  selectedAddress: GeocodeResult | null;
  description: string;
  price: string; // exact price input, not range
  imageFile: File | null; // poster image
}

export interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

export const vibeOptions: { key: EventVibe; label: string; emoji: string }[] = [
  { key: 'rave', label: 'Rave', emoji: '⚡' },
  { key: 'chill', label: 'Chill', emoji: '🌊' },
  { key: 'afterwork', label: 'Afterwork', emoji: '🥂' },
  { key: 'cosy', label: 'Cosy', emoji: '🕯️' },
  { key: 'concert', label: 'Concert', emoji: '🎸' },
];

export const typeOptions = [
  { key: 'soirée' as const, label: 'Soirée', emoji: '🎉' },
  { key: 'club' as const, label: 'Club', emoji: '🎧' },
  { key: 'bar' as const, label: 'Bar', emoji: '🍸' },
  { key: 'concert' as const, label: 'Concert', emoji: '🎸' },
  { key: 'afterwork' as const, label: 'Afterwork', emoji: '🥂' },
  { key: 'festival' as const, label: 'Festival', emoji: '🎪' },
];

export const genreOptions: MusicGenre[] = ['electro', 'techno', 'house', 'pop', 'rock', 'indie', 'r&b', 'jazz'];

export const imageColors = ['#1a0f2e', '#0f1a2e', '#0a1020', '#1a0a0a', '#0a1a10', '#1a1400', '#1a100a'];
