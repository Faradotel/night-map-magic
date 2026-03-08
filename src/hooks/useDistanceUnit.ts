import { useState, useCallback } from 'react';

export type DistanceUnit = 'km' | 'miles' | 'meters';

const STORAGE_KEY = 'pulsemap-distance-unit';

const unitLabels: Record<DistanceUnit, string> = {
  km: 'km',
  miles: 'mi',
  meters: 'm',
};

function getStoredUnit(): DistanceUnit {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'km' || v === 'miles' || v === 'meters') return v;
  } catch {}
  return 'km';
}

/** Convert a distance in km to the chosen unit */
export function convertDistance(km: number, unit: DistanceUnit): number {
  switch (unit) {
    case 'miles': return km * 0.621371;
    case 'meters': return km * 1000;
    default: return km;
  }
}

/** Format a distance (given in km) for display */
export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = convertDistance(km, unit);
  if (unit === 'meters') {
    return `${Math.round(value)} ${unitLabels[unit]}`;
  }
  return `${value.toFixed(1)} ${unitLabels[unit]}`;
}

export function useDistanceUnit() {
  const [unit, setUnitState] = useState<DistanceUnit>(getStoredUnit);

  const setUnit = useCallback((u: DistanceUnit) => {
    setUnitState(u);
    try { localStorage.setItem(STORAGE_KEY, u); } catch {}
  }, []);

  const cycleUnit = useCallback(() => {
    setUnitState(prev => {
      const next: DistanceUnit = prev === 'km' ? 'miles' : prev === 'miles' ? 'meters' : 'km';
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  return { unit, setUnit, cycleUnit, formatDistance: (km: number) => formatDistance(km, unit), unitLabel: unitLabels[unit] };
}
