import { supabase } from '@/integrations/supabase/client';
import { NightEvent } from '@/data/mockEvents';

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

    // Convert to NightEvent format
    return data.events.map((e: ShotgunRawEvent): NightEvent => ({
      id: e.id,
      name: e.name.toUpperCase(),
      type: 'soirée' as const,
      vibe: 'rave' as const,
      genres: ['electro'] as any,
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
    }));
  } catch (err) {
    console.error('Failed to fetch Shotgun events:', err);
    return [];
  }
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
