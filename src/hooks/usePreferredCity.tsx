import { useState, useCallback } from 'react';

const STORAGE_KEY = 'pulsemap_preferred_city';

export function usePreferredCity() {
  const [preferredCity, setPreferredCityState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setPreferredCity = useCallback((city: string) => {
    setPreferredCityState(city);
    try { localStorage.setItem(STORAGE_KEY, city); } catch {}
  }, []);

  return { preferredCity, setPreferredCity };
}
