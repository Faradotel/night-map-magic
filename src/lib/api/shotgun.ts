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

const BROCANTE_PATTERN = /\b(vide[\s-]?grenier|vide[\s-]?dressing|brocante|braderie|puces|march[ée]\s+aux?\s+puces|march[ée]\s+du\s+livre|vinyles?)\b/i;

const EVENT_VIBES = new Set<EventVibe>(['rave', 'chill', 'afterwork', 'cosy', 'concert', 'culture', 'sport']);
const EVENT_TYPES = new Set<NightEvent['type']>(['soirée', 'club', 'bar', 'concert', 'afterwork', 'sport', 'théâtre', 'expo', 'festival', 'spectacle', 'brocante']);

function isStoredEventVibe(value: string): value is EventVibe {
  return EVENT_VIBES.has(value as EventVibe);
}

function isStoredEventType(value: string): value is NightEvent['type'] {
  return EVENT_TYPES.has(value as NightEvent['type']);
}

// Deduce vibe from genres
export function deduceVibe(genres: MusicGenre[], name: string): EventVibe {
  const nameLower = name.toLowerCase();

  // New event categories
  if (BROCANTE_PATTERN.test(nameLower)) return 'culture';
  if (/\b(foot|rugby|basket|tennis|handball|match|stade|marathon|sport|boxe|mma)\b/i.test(nameLower)) return 'sport';
  if (/\b(théâtre|theater|theatre|comédie|one.?man.?show|humour|stand.?up|exposition|expo|vernissage|musée|galerie|spectacle|cabaret|cirque|danse|ballet|opéra|magie)\b/i.test(nameLower)) return 'culture';

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

export function mapGenres(rawGenres: string[]): MusicGenre[] {
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

 export function deduceType(name: string): 'soirée' | 'club' | 'bar' | 'concert' | 'afterwork' | 'sport' | 'théâtre' | 'expo' | 'festival' | 'spectacle' | 'brocante' {
  const lower = name.toLowerCase();
  if (BROCANTE_PATTERN.test(lower)) return 'brocante';
  if (/\b(foot|rugby|basket|tennis|handball|volley|match|stade|marathon|course|cyclisme|sport|natation|athlétisme|boxe|mma|judo|karaté)\b/i.test(lower)) return 'sport';
  if (/\b(théâtre|theater|theatre|comédie|tragédie|pièce de théâtre|one.?man.?show|humour|stand.?up|improvisation)\b/i.test(lower)) return 'théâtre';
  if (/\b(exposition|expo|vernissage|musée|galerie|art contemporain)\b/i.test(lower)) return 'expo';
  if (/\b(festival|fest\b|fête de la)/i.test(lower)) return 'festival';
  if (/\b(spectacle|cabaret|cirque|danse|ballet|opéra|magie|marionnettes)\b/i.test(lower)) return 'spectacle';
  if (/concert|live|showcase/i.test(lower)) return 'concert';
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
      { headers: { 'User-Agent': 'PulseMap/1.0' } }
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
 * Deduplicate events: if two events have very similar names (regardless of distance), keep only one.
 * Also dedup by same venue within 500m. Prefer Shotgun over Ticketmaster.
 */
export function deduplicateEvents(events: NightEvent[]): NightEvent[] {
  const kept: NightEvent[] = [];
  const seenNames = new Map<string, number>(); // normalized name -> index in kept

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-zà-ÿ0-9]/g, '').slice(0, 60);

  for (const event of events) {
    const normName = normalize(event.name);
    
    // Check exact name match (anywhere in France)
    if (normName.length > 5 && seenNames.has(normName)) {
      continue; // skip duplicate
    }

    const isDuplicate = kept.some(existing => {
      const dist = getDistance(existing.lat, existing.lng, event.lat, event.lng);

      // Same name within 5km = duplicate (same event, slightly different coords)
      if (dist < 5) {
        const n1 = normalize(existing.name);
        const n2 = normName;
        if (n1 === n2) return true;
        if (n1.length > 8 && n2.length > 8 && (n1.includes(n2) || n2.includes(n1))) return true;
      }

      // Same venue within 500m = duplicate  
      if (dist < 0.5 && existing.venue && event.venue) {
        const v1 = normalize(existing.venue);
        const v2 = normalize(event.venue);
        if (v1 === v2 && v1.length > 3) return true;
      }

      return false;
    });

    if (!isDuplicate) {
      kept.push(event);
      if (normName.length > 5) {
        seenNames.set(normName, kept.length - 1);
      }
    }
  }

  return kept;
}

/**
 * Load events for a city: try cache first, fallback to live scraping
 */
export async function loadEventsForCity(city: string): Promise<NightEvent[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cached_events')
    .select('*')
    .ilike('city', `${city}%`)
    .or(`start_time.gte.${now},end_time.gte.${now}`);

  if (error) {
    console.error('Error loading cached events:', error);
    return [];
  }

  return (data || []).map(cachedToNightEvent);
}

/**
 * Load cached events near coordinates (for "nearby" mode)
 */
export async function loadEventsNearby(lat: number, lng: number, radiusKm: number): Promise<NightEvent[]> {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cached_events')
    .select('*')
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .or(`start_time.gte.${now},end_time.gte.${now}`);

  if (error) {
    console.error('Error loading nearby cached events:', error);
    return [];
  }

  return (data || []).map(cachedToNightEvent);
}

function cachedToNightEvent(e: any): NightEvent {
  const genres = mapGenres(e.genres || []);
  const storedVibe = typeof e.vibe === 'string' ? e.vibe.toLowerCase() : '';
  const storedType = typeof e.type === 'string' ? e.type.toLowerCase() : '';
  const vibe = isStoredEventVibe(storedVibe) ? storedVibe : deduceVibe(genres, e.name);
  const type = isStoredEventType(storedType) ? storedType : deduceType(e.name);
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
    startTime: e.start_time,
    endTime: e.end_time,
    priceRange: parsePriceRange(e.price_range),
    description: e.description,
    venue: e.venue,
    ticketUrl: e.ticket_url,
    imageColor: e.image_color || '#1a0f2e',
    imageUrl: e.image_url || undefined,
    isLive: false,
    externalAttendees: e.external_attendees || null,
  };
}

/**
 * Load all upcoming events from every city (France mode)
 */
export async function loadAllEvents(): Promise<NightEvent[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cached_events')
    .select('*')
    .or(`start_time.gte.${now},end_time.gte.${now}`)
    .order('start_time', { ascending: true })
    .limit(2000);

  if (error) {
    console.error('Error loading all events:', error);
    return [];
  }

  return (data || []).map(cachedToNightEvent);
}

/**
 * Load cached events near coordinates (for "nearby" mode)
 */
export async function loadCachedEventsNearby(lat: number, lng: number, radiusKm: number): Promise<NightEvent[]> {
  // Rough bounding box filter (1 degree ~ 111km)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cached_events')
    .select('*')
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .or(`start_time.gte.${now},end_time.gte.${now}`);

  if (error || !data) return [];

  return data.map(cachedToNightEvent);
}

export function parsePriceRange(price?: string | null): 'gratuit' | '€1-10' | '€10-20' | '€20+' {
  if (!price) return '€10-20';
  const lower = price.toLowerCase();
  if (lower.includes('gratuit') || lower.includes('free') || lower === '0') return 'gratuit';
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num === 0) return 'gratuit';
  if (num <= 10) return '€1-10';
  if (num <= 20) return '€10-20';
  return '€20+';
}
