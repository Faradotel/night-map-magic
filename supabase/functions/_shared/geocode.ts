// Drop-in replacement for fetch() on Nominatim search URLs.
// Nominatim now answers "Access denied" to our edge IPs, which silently broke
// geocoding (events stacked on department centroids, Shotgun returning 0).
// geoFetch keeps the Nominatim response shape but falls back to Photon (OSM,
// handles venue names) then the French government address API.

type NomResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

const UA = 'PulseMap/1.0 (https://pulse-map.live; contact@pulse-map.live)';

function jsonResponse(data: NomResult[]): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function tryNominatim(url: string): Promise<NomResult[] | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr' } });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith('[')) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function tryPhoton(q: string): Promise<NomResult[] | null> {
  try {
    // Bias to France bbox
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=fr&bbox=-5.5,41.2,9.8,51.2`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f) return [];
    const p = f.properties || {};
    const [lon, lat] = f.geometry.coordinates;
    const city = p.city || p.town || p.village || p.name;
    const parts = [p.name, [p.housenumber, p.street].filter(Boolean).join(' '), p.postcode, city].filter(Boolean);
    return [{
      lat: String(lat),
      lon: String(lon),
      display_name: parts.join(', '),
      address: {
        house_number: p.housenumber, road: p.street, postcode: p.postcode,
        city: p.city, town: p.town, village: p.village, county: p.county, state: p.state,
      },
    }];
  } catch {
    return null;
  }
}

async function tryBan(q: string): Promise<NomResult[] | null> {
  try {
    const clean = q.replace(/,?\s*France\s*$/i, '');
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(clean)}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f) return [];
    const p = f.properties || {};
    const [lon, lat] = f.geometry.coordinates;
    return [{
      lat: String(lat),
      lon: String(lon),
      display_name: p.label || '',
      address: { house_number: p.housenumber, road: p.street, postcode: p.postcode, city: p.city },
    }];
  } catch {
    return null;
  }
}

export async function geoFetch(url: string, _init?: unknown): Promise<Response> {
  const q = new URL(url).searchParams.get('q') || '';
  const nom = await tryNominatim(url);
  if (nom && nom.length > 0) return jsonResponse(nom);
  if (!q) return jsonResponse([]);
  const photon = await tryPhoton(q);
  if (photon && photon.length > 0) return jsonResponse(photon);
  const ban = await tryBan(q);
  return jsonResponse(ban || []);
}
