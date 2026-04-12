import { useEffect, useCallback } from 'react';
import { NightEvent } from '@/data/mockEvents';

const CACHE_KEY = 'pulsemap_offline_events';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const CACHE_VERSION = 2;

interface CachedData {
  events: NightEvent[];
  timestamp: number;
  version: number;
}

export function useOfflineEvents() {
  const cacheEvents = useCallback((events: NightEvent[]) => {
    try {
      const data: CachedData = { events, timestamp: Date.now(), version: CACHE_VERSION };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full — silently fail
    }
  }, []);

  const getCachedEvents = useCallback((): NightEvent[] | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data: CachedData = JSON.parse(raw);
      if (data.version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      if (Date.now() - data.timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data.events;
    } catch {
      return null;
    }
  }, []);

  const isOffline = useCallback(() => !navigator.onLine, []);

  return { cacheEvents, getCachedEvents, isOffline };
}
