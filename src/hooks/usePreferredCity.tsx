import { useState, useCallback } from 'react';

const STORAGE_KEY = 'pulsemap_preferred_city';
const DEFAULT_CITY = 'Paris';

export function usePreferredCity() {
  const [preferredCity, setPreferredCityState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_CITY;
    } catch {
      return DEFAULT_CITY;
    }
  });

  const setPreferredCity = useCallback((city: string) => {
    setPreferredCityState(city);
    localStorage.setItem(STORAGE_KEY, city);
  }, []);

  return { preferredCity, setPreferredCity };
}
