import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd, eventLd, placeLd } from '@/lib/seo/jsonld';
import { CITY_SLUGS, eventSlug } from '@/lib/seo/slug';

interface CachedEvent {
  id: string;
  name: string;
  city: string;
  venue: string;
  address: string;
  lat: number;
  lng: number;
  start_time: string;
  end_time: string | null;
  description: string;
  image_url: string | null;
  ticket_url: string | null;
  price_range: string;
  type: string;
}

// English-language SEO page targeting tourist queries like "Paris nightlife",
// "Lyon nightlife", etc. Same data as CityPage, English copy and metadata.
export default function NightlifePage() {
  const { slug = '' } = useParams();
  const cityName = CITY_SLUGS[slug.toLowerCase()];
  const [events, setEvents] = useState<CachedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityName) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from('cached_events')
        .select('id,name,city,venue,address,lat,lng,start_time,end_time,description,image_url,ticket_url,price_range,type')
        .ilike('city', cityName)
        .or(`start_time.gte.${nowIso},end_time.gte.${nowIso}`)
        .order('start_time', { ascending: true })
        .limit(60);
      if (!cancel) {
        setEvents((data as CachedEvent[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [cityName]);

  if (!cityName) return <Navigate to="/villes" replace />;

  const canonical = `/en/nightlife/${slug.toLowerCase()}`;
  const title = `${cityName} Nightlife Tonight — Clubs, Bars & Live Music`;
  const description = `Discover ${cityName} nightlife tonight: live map of clubs, bars, concerts, parties and festivals happening right now in ${cityName}. Free, no sign-up.`;
  const ogTitle = `${cityName} Nightlife — Where to Go Out Tonight`;
  const ogDescription = `Live interactive map of ${cityName} nightlife: clubs, bars, concerts and parties happening tonight. Free, no sign-up.`;

  const faqs = [
    {
      q: `Where is the best nightlife in ${cityName}?`,
      a: `${cityName}'s best nightlife spots — clubs, live music venues, cocktail bars and late-night parties — are shown in real time on the PulseMap interactive map. Filter by type, distance or time to find the perfect spot tonight.`,
    },
    {
      q: `What is there to do tonight in ${cityName}?`,
      a: `Tonight in ${cityName} you can catch live concerts, electronic and techno parties, clubs, afterworks, festivals, night exhibitions or a lively bar. Every event is geolocated and updated continuously on PulseMap.`,
    },
    {
      q: `How do I find a party tonight in ${cityName}?`,
      a: `Open PulseMap, select ${cityName} and enable the "tonight" filter. The map instantly shows every party happening tonight in ${cityName} with times, venue and ticket link.`,
    },
    {
      q: `Is PulseMap free to explore ${cityName} nightlife?`,
      a: `Yes, PulseMap is 100% free. Browse the ${cityName} nightlife map with no sign-up. An account is only needed for social features (friends, check-ins, badges).`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const ld: object[] = [
    placeLd(cityName),
    breadcrumbLd([
      { name: 'Home', url: '/' },
      { name: 'Nightlife', url: '/en/nightlife' },
      { name: cityName, url: canonical },
    ]),
    faqLd,
  ];
  events.slice(0, 20).forEach(e =>
    ld.push(eventLd({
      id: e.id,
      name: e.name,
      description: e.description,
      startTime: e.start_time,
      endTime: e.end_time || undefined,
      venue: e.venue,
      address: e.address,
      city: e.city,
      lat: e.lat,
      lng: e.lng,
      imageUrl: e.image_url || undefined,
      ticketUrl: e.ticket_url || undefined,
      priceRange: e.price_range,
    }, `/evenements/${eventSlug(e.name, e.id)}`))
  );

  return (
    <>
      <SEO
        title={title}
        description={description}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        canonical={canonical}
        jsonLd={ld}
        hreflang={[
          { lang: 'en', path: canonical },
          { lang: 'fr', path: `/sortir-ce-soir/${slug.toLowerCase()}` },
          { lang: 'x-default', path: `/sortir-ce-soir/${slug.toLowerCase()}` },
        ]}
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Home</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium">Nightlife</span>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">{cityName}</span>
        </nav>

        <h1 className="text-3xl font-black mb-2">{cityName} Nightlife Tonight</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Looking for the best <strong>{cityName} nightlife</strong> tonight? PulseMap tracks
          every club, bar, concert, party and festival happening right now in {cityName} on a
          live interactive map — with times, venues and ticket links.
        </p>

        <Link
          to={`/?city=${encodeURIComponent(cityName)}`}
          className="inline-block mb-6 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          Open the live {cityName} nightlife map
        </Link>

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="text-xl font-bold mb-3">Tonight in {cityName} — upcoming events</h2>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">No events listed yet.</p>
          )}
          <ul className="space-y-2">
            {events.map(e => (
              <li key={e.id}>
                <Link
                  to={`/evenements/${eventSlug(e.name, e.id)}`}
                  className="block p-3 rounded-xl border border-border bg-secondary hover:bg-accent/10 transition-colors"
                >
                  <h3 className="font-bold text-sm">{e.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.start_time).toLocaleString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })} · {e.venue}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-bold text-foreground mb-2">Where to go out tonight in {cityName}</h2>
          <p>
            Whether you're after a techno party, a live concert, a festival, an afterwork or
            simply a lively bar, PulseMap gathers the best {cityName} nightlife spots in one
            place. The live map shows what's happening around you right now — times, venues,
            prices and tickets. No more juggling Shotgun, Ticketmaster or Facebook to find out
            where to go tonight in {cityName}.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="other-cities-h2">
          <h2 id="other-cities-h2" className="text-base font-bold text-foreground mb-3">
            Nightlife in other French cities
          </h2>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(CITY_SLUGS).filter(([s]) => s !== slug.toLowerCase()).slice(0, 30).map(([s, n]) => (
              <li key={s}>
                <Link
                  to={`/en/nightlife/${s}`}
                  className="inline-block px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-medium"
                >
                  {n}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-bold text-foreground mb-3">FAQ — {cityName} nightlife</h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-secondary p-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground flex items-center justify-between gap-2">
                  <span>{f.q}</span>
                  <span className="text-lg leading-none transition-transform group-open:rotate-45 text-accent" aria-hidden>+</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          <Link to={`/sortir-ce-soir/${slug.toLowerCase()}`} className="underline">
            Version française : sortir ce soir à {cityName}
          </Link>
        </p>
      </main>
    </>
  );
}
