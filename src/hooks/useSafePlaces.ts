import { useQuery } from '@tanstack/react-query';

export type SafePlaceType = 'tabac' | 'pharmacy' | 'police' | 'bar';

export interface SafePlace {
  id: string;
  type: SafePlaceType;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  hours?: string;
}

// Raw record from /data/safe-places.json (compact keys to keep payload small)
interface RawSafePlace {
  i: number;
  t: 'p' | 't' | 'o'; // pharmacy / tabac / police
  n: string;
  la: number;
  lo: number;
  a?: string;
  p?: string;
  h?: string;
}

const TYPE_BY_KEY: Record<RawSafePlace['t'], SafePlaceType> = {
  p: 'pharmacy',
  t: 'tabac',
  o: 'police',
};

async function fetchSafePlaces(): Promise<SafePlace[]> {
  const res = await fetch('/data/safe-places.json');
  if (!res.ok) throw new Error('Impossible de charger les lieux sûrs');
  const raw: RawSafePlace[] = await res.json();
  return raw.map((r) => ({
    id: `sp-${r.i}`,
    type: TYPE_BY_KEY[r.t],
    name: r.n,
    lat: r.la,
    lng: r.lo,
    address: r.a,
    phone: r.p,
    hours: r.h,
  }));
}

export function useSafePlaces({ enabled = false }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['safe-places-v1'],
    queryFn: fetchSafePlaces,
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24,
  });
}
