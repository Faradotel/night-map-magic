import { supabase } from '@/integrations/supabase/client';
import { NightEvent, MusicGenre, EventVibe, getDistance } from '@/data/mockEvents';

interface ShotgunRawEvent {
  id: string;
  name: string;
  venue: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime?: string;
  description: string;
  ticketUrl: string;
  price?: string | null;
  genres?: string[];
}

// Map raw genre strings from Shotgun to our MusicGenre type
const GENRE_MAP: Record<string, MusicGenre> = {
  'techno': 'techno',
  'tech house': 'techno',
  'hard techno': 'techno',
  'industrial techno': 'techno',
  'minimal': 'techno',
  'house': 'house',
  'deep house': 'house',
  'afro house': 'house',
  'melodic house': 'house',
  'disco house': 'house',
  'electro': 'electro',
  'electronic': 'electro',
  'edm': 'electro',
  'trance': 'electro',
  'psytrance': 'electro',
  'drum and bass': 'electro',
  'drum & bass': 'electro',
  'dnb': 'electro',
  'dubstep': 'electro',
  'bass music': 'electro',
  'trap': 'electro',
  'hardstyle': 'electro',
  'hardcore': 'electro',
  'gabber': 'electro',
  'pop': 'pop',
  'dance': 'pop',
  'disco': 'pop',
  'funk': 'pop',
  'soul': 'pop',
  'rock': 'rock',
  'metal': 'rock',
  'punk': 'rock',
  'alternative': 'rock',
  'indie': 'indie',
  'folk': 'indie',
  'singer-songwriter': 'indie',
  'rnb': 'r&b',
  'r&b': 'r&b',
  'hip-hop': 'r&b',
  'hip hop': 'r&b',
  'rap': 'r&b',
  'afrobeat': 'r&b',
  'afrobeats': 'r&b',
  'dancehall': 'r&b',
  'reggaeton': 'r&b',
  'latin': 'r&b',
  'jazz': 'jazz',
  'blues': 'jazz',
  'swing': 'jazz',
  'bossa nova': 'jazz',
  'world': 'jazz',
  'classical': 'jazz',
  'ambient': 'jazz',
};

// Deduce vibe from genres
function deduceVibe(genres: MusicGenre[], name: string): EventVibe {
  const nameLower = name.toLowerCase();

  if (/afterwork|after[\s-]?work|apéro|happy\s?hour/i.test(nameLower)) return 'afterwork';
  if (/concert|live|showcase/i.test(nameLower)) return 'concert';
  if (/chill|lounge|acoustic|acoustique|zen/i.test(nameLower)) return 'chill';
  if (/cosy|intimate|intime|feutré/i.test(nameLower)) return 'cosy';

  if (genres.includes('jazz') || genres.includes('indie')) return 'chill';
  if (genres.includes('rock')) return 'concert';
  if (genres.includes('techno') || genres.includes('electro') || genres.includes('house')) return 'rave';
  if (genres.includes('r&b') || genres.includes('pop')) return 'chill';

  return 'rave';
}

function mapGenres(rawGenres: string[]): MusicGenre[] {
  const mapped = new Set<MusicGenre>();
  for (const raw of rawGenres) {
    const lower = raw.toLowerCase().trim();
    const match = GENRE_MAP[lower];
    if (match) {
      mapped.add(match);
    } else {
      for (const [key, value] of Object.entries(GENRE_MAP)) {
        if (lower.includes(key) || key.includes(lower)) {
          mapped.add(value);
          break;
        }
      }
    }
  }
  return mapped.size > 0 ? Array.from(mapped) : ['electro'];
}

function deduceType(name: string): 'soirée' | 'club' | 'bar' | 'concert' | 'afterwork' {
  const lower = name.toLowerCase();
  if (/concert|live|showcase|festival/i.test(lower)) return 'concert';
  if (/afterwork|after[\s-]?work|apéro/i.test(lower)) return 'afterwork';
  if (/bar|pub|tavern/i.test(lower)) return 'bar';
  if (/club|discotheque|discothèque/i.test(lower)) return 'club';
  return 'soirée';
}

/**
 * Reverse-geocode coordinates to city name via Nominatim
 */
export async function reverseGeocodeCity(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'User-Agent': 'NightMap/1.0' } }
    );
    const data = await res.json();
    return data?.address?.city || data?.address?.town || data?.address?.village || null;
  } catch {
    return null;
  }
}

/**
 * Fetch Shotgun events for a city via edge function
 */
export async function fetchShotgunEvents(city: string): Promise<NightEvent[]> {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-shotgun', {
      body: { city },
    });

    if (error) {
      console.error('Edge function error:', error);
      return [];
    }

    if (!data?.success || !data?.events) {
      console.warn('No Shotgun events found for', city);
      return [];
    }

    return data.events.map((e: ShotgunRawEvent): NightEvent => {
      const genres = mapGenres(e.genres || []);
      const vibe = deduceVibe(genres, e.name);
      const type = deduceType(e.name);

      return {
        id: e.id,
        name: e.name.toUpperCase(),
        type,
        vibe,
        genres,
        lat: e.lat,
        lng: e.lng,
        address: e.address,
        city: e.city,
        startTime: e.startTime,
        endTime: e.endTime,
        priceRange: parsePriceRange(e.price),
        description: e.description,
        venue: e.venue,
        ticketUrl: e.ticketUrl,
        imageColor: '#1a0f2e',
        isLive: false,
      };
    });
  } catch (err) {
    console.error('Failed to fetch Shotgun events:', err);
    return [];
  }
}

/**
 * Fetch Ticketmaster events for a city via edge function
 */
export async function fetchTicketmasterEvents(city: string): Promise<NightEvent[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-ticketmaster', {
      body: { city },
    });

    if (error) {
      console.error('Ticketmaster edge function error:', error);
      return [];
    }

    if (!data?.success || !data?.events) {
      console.warn('No Ticketmaster events found for', city);
      return [];
    }

    return data.events.map((e: any): NightEvent => {
      const genres = mapGenres(e.genres || []);
      const vibe = deduceVibe(genres, e.name);
      const type = deduceType(e.name);

      return {
        id: e.id,
        name: e.name.toUpperCase(),
        type,
        vibe,
        genres,
        lat: e.lat,
        lng: e.lng,
        address: e.address,
        city: e.city,
        startTime: e.startTime,
        endTime: e.endTime,
        priceRange: parsePriceRange(e.price),
        description: e.description,
        venue: e.venue,
        ticketUrl: e.ticketUrl,
        imageColor: '#1a0f2e',
        isLive: false,
      };
    });
  } catch (err) {
    console.error('Failed to fetch Ticketmaster events:', err);
    return [];
  }
}

/**
 * Deduplicate events: if two events are within 200m and have similar names, keep only one (prefer Shotgun)
 */
export function deduplicateEvents(events: NightEvent[]): NightEvent[] {
  const kept: NightEvent[] = [];

  for (const event of events) {
    const isDuplicate = kept.some(existing => {
      const dist = getDistance(existing.lat, existing.lng, event.lat, event.lng);
      if (dist > 0.2) return false; // > 200m apart

      // Check name similarity
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const n1 = normalize(existing.name);
      const n2 = normalize(event.name);
      if (n1 === n2) return true;
      if (n1.includes(n2) || n2.includes(n1)) return true;

      // Same venue = duplicate
      if (existing.venue && event.venue) {
        const v1 = normalize(existing.venue);
        const v2 = normalize(event.venue);
        if (v1 === v2 && v1.length > 3) return true;
      }

      return false;
    });

    if (!isDuplicate) {
      kept.push(event);
    }
  }

  return kept;
}

function parsePriceRange(price?: string | null): 'gratuit' | '€1-10' | '€10-20' | '€20+' {
  if (!price) return '€10-20';
  const lower = price.toLowerCase();
  if (lower.includes('gratuit') || lower.includes('free') || lower === '0') return 'gratuit';
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num === 0) return 'gratuit';
  if (num <= 10) return '€1-10';
  if (num <= 20) return '€10-20';
  return '€20+';
}
