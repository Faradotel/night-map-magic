// InfoConcert festival scraper — BULK mode (single call per refresh).
// Source: https://www.infoconcert.com/festival-concerts-saison/<year>
// Lists ~500+ upcoming festivals with name, dates, city (dept), festival URL.
// InfoConcert is Cloudflare-protected → we go through Firecrawl.

const ALLOWED_ORIGINS = [
  'https://pulse-map.live',
  'https://www.pulse-map.live',
  'https://pulsemap-official.lovable.app',
  'https://id-preview--558c7333-dd3f-4317-a4d6-54b2b3b30b02.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

const MONTHS_FR: Record<string, number> = {
  'janvier': 0, 'février': 1, 'fevrier': 1, 'mars': 2, 'avril': 3, 'mai': 4,
  'juin': 5, 'juillet': 6, 'août': 7, 'aout': 7, 'septembre': 8,
  'octobre': 9, 'novembre': 10, 'décembre': 11, 'decembre': 11,
};

function parseFrenchDateRange(text: string): { start: string; end: string | null } | null {
  // "Du 15 juillet au 18 juillet 2026"  or  "Du 15 juillet 2026 au 18 juillet 2026"
  // or  "Le 20 juillet 2026"  or "20 juillet 2026"
  const rangeRe = /Du\s+(\d{1,2})\s+([a-zéûôA-Z]+)(?:\s+(\d{4}))?\s+au\s+(\d{1,2})\s+([a-zéûôA-Z]+)\s+(\d{4})/i;
  const singleRe = /(?:Le\s+)?(\d{1,2})\s+([a-zéûôA-Z]+)\s+(\d{4})/i;
  let m = text.match(rangeRe);
  if (m) {
    const [, d1, mo1, y1opt, d2, mo2, y2] = m;
    const y = y1opt || y2;
    const mo1Idx = MONTHS_FR[mo1.toLowerCase()];
    const mo2Idx = MONTHS_FR[mo2.toLowerCase()];
    if (mo1Idx === undefined || mo2Idx === undefined) return null;
    const start = new Date(Date.UTC(parseInt(y), mo1Idx, parseInt(d1), 18, 0));
    const end = new Date(Date.UTC(parseInt(y2), mo2Idx, parseInt(d2), 23, 59));
    if (isNaN(start.getTime())) return null;
    return { start: start.toISOString(), end: isNaN(end.getTime()) ? null : end.toISOString() };
  }
  m = text.match(singleRe);
  if (m) {
    const [, d, mo, y] = m;
    const moIdx = MONTHS_FR[mo.toLowerCase()];
    if (moIdx === undefined) return null;
    const start = new Date(Date.UTC(parseInt(y), moIdx, parseInt(d), 18, 0));
    if (isNaN(start.getTime())) return null;
    return { start: start.toISOString(), end: null };
  }
  return null;
}

interface RawFestival {
  name: string;
  startTime: string;
  endTime: string | null;
  city: string;
  dept: string;
  url: string;
}

function parseListing(markdown: string): RawFestival[] {
  const out: RawFestival[] = [];
  const seen = new Set<string>();
  // Each festival card is a single markdown link containing an image, name, date, city.
  // Firecrawl outputs continuation lines separated by `\\` (escaped backslash) or newlines.
  // We match the full link block ending at ](url).
  const cardRe = /\[!\[[^\]]*\]\([^)]+\)([\s\S]*?)\]\((https:\/\/www\.infoconcert\.com\/festival\/[a-z0-9-]+\/concerts)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(markdown)) !== null) {
    const inner = m[1].replace(/\\\\/g, ' ').replace(/\\/g, ' ').replace(/\s+/g, ' ').trim();
    const url = m[2];
    if (seen.has(url)) continue;

    // Split: NAME  Du ... YYYY  CITY (DD)
    const cityMatch = inner.match(/([A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]{1,60}?)\s*\((\d{2,3}|[A-Z]{2,20})\)\s*$/);
    if (!cityMatch) continue;
    const city = cityMatch[1].trim();
    const dept = cityMatch[2].trim();

    // Skip non-French departments (Luxembourg, Belgique, etc. — dept is a country name)
    if (!/^\d{2,3}$/.test(dept)) continue;

    const beforeCity = inner.slice(0, cityMatch.index).trim();
    const parsed = parseFrenchDateRange(beforeCity);
    if (!parsed) continue;

    // Skip past festivals
    const startTs = new Date(parsed.start).getTime();
    const endTs = parsed.end ? new Date(parsed.end).getTime() : startTs;
    if (endTs < Date.now() - 86400000) continue;

    // Extract name: everything before " Du " (French date range indicator)
    const nameMatch = beforeCity.match(/^(.+?)\s+Du\s+\d/i) || beforeCity.match(/^(.+?)\s+Le\s+\d/i) || beforeCity.match(/^(.+?)\s+\d{1,2}\s+[a-zéû]+\s+\d{4}/i);
    let name = (nameMatch ? nameMatch[1] : beforeCity).trim();
    // strip repeated name (image alt often duplicates)
    name = name.replace(/^Affiche\s+/i, '').trim();
    // Firecrawl repeats the alt text once: "Foo Foo" → "Foo"
    const halfLen = Math.floor(name.length / 2);
    if (halfLen > 4 && name.slice(0, halfLen).trim() === name.slice(halfLen).trim()) {
      name = name.slice(0, halfLen).trim();
    }
    if (!name || name.length < 3) continue;

    seen.add(url);
    out.push({
      name,
      startTime: parsed.start,
      endTime: parsed.end,
      city,
      dept,
      url,
    });
  }
  return out;
}

async function geocode(q: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'PulseMap/1.0 (pulse-map.live)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name || '',
      };
    }
  } catch { /* ignore */ }
  return null;
}

async function scrapeSeason(year: number, firecrawlKey: string): Promise<string> {
  const url = `https://www.infoconcert.com/festival-concerts-saison/${year}`;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 4000,
        location: { country: 'FR', languages: ['fr'] },
      }),
    });
    if (!res.ok) {
      console.log(`[ICF] season ${year} scrape failed: ${res.status}`);
      return '';
    }
    const data = await res.json();
    return data?.data?.markdown || data?.markdown || '';
  } catch (e) {
    console.log(`[ICF] season ${year} error:`, e);
    return '';
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const _serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const _auth = req.headers.get('authorization') || '';
  if (_auth !== `Bearer ${_serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ success: true, byCity: {} }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const currentYear = new Date().getUTCFullYear();
    const years = [currentYear, currentYear + 1];

    console.log(`[ICF] Firecrawl scraping seasons: ${years.join(', ')}`);
    const markdowns = await Promise.all(years.map(y => scrapeSeason(y, firecrawlKey)));

    let allRaw: RawFestival[] = [];
    for (const md of markdowns) {
      if (md) allRaw.push(...parseListing(md));
    }
    // Dedup by url across years
    const seenUrls = new Set<string>();
    allRaw = allRaw.filter(f => {
      if (seenUrls.has(f.url)) return false;
      seenUrls.add(f.url);
      return true;
    });
    console.log(`[ICF] Parsed ${allRaw.length} unique upcoming festivals`);

    // Geocode each festival: "<name>, <city>, France" — Nominatim rate ~1 req/s
    const byCity: Record<string, any[]> = {};
    for (let i = 0; i < allRaw.length; i++) {
      const f = allRaw[i];
      // 1) Try festival name + city (often resolves to the actual venue)
      let geo = await geocode(`${f.name}, ${f.city}, France`);
      // 2) Fall back to city + dept
      if (!geo) geo = await geocode(`${f.city} ${f.dept}, France`);
      if (!geo) {
        console.log(`[ICF] geocode failed: ${f.name} / ${f.city}`);
        continue;
      }

      const cityNorm = f.city.replace(/\s*\(\d+\)\s*$/, '').trim();
      const idBase = `icf-${f.url.match(/festival\/([a-z0-9-]+)\/concerts/)?.[1] || 'x'}`;

      const event = {
        id: idBase,
        name: f.name,
        venue: cityNorm,
        address: geo.address || `${cityNorm} (${f.dept})`,
        city: cityNorm,
        lat: geo.lat,
        lng: geo.lng,
        startTime: f.startTime,
        endTime: f.endTime,
        description: '• via InfoConcert',
        ticketUrl: f.url,
        price: null,
        genres: [],
        externalAttendees: null,
      };
      (byCity[cityNorm] ??= []).push(event);
    }

    const total = Object.values(byCity).reduce((s, arr) => s + arr.length, 0);
    console.log(`[ICF] Returning ${total} festivals across ${Object.keys(byCity).length} cities`);

    return new Response(JSON.stringify({ success: true, byCity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[ICF] Error:', err);
    return new Response(JSON.stringify({ success: true, byCity: {} }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
