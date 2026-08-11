import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd, eventLd, placeLd } from '@/lib/seo/jsonld';
import { CITY_SLUGS, eventSlug } from '@/lib/seo/slug';
import { EventCard } from '@/components/EventCard';
import { EventCarousel } from '@/components/EventCarousel';
import { FloatingMapButton } from '@/components/FloatingMapButton';

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
  image_color: string;
  ticket_url: string | null;
  price_range: string;
  type: string;
  vibe: string;
  genres: string[];
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
        .select('id,name,city,venue,address,lat,lng,start_time,end_time,description,image_url,image_color,ticket_url,price_range,type,vibe,genres')
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

  const eventsCount = events.length;
  const eventsCountLabel = eventsCount === 60 ? '60+' : String(eventsCount);

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
        {eventsCount > 0 && (
          <p className="text-base font-bold text-accent mb-4">
            {eventsCountLabel} {eventsCount === 1 ? 'event' : 'events'} in {cityName} tonight
          </p>
        )}

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="sr-only">Tonight in {cityName} — upcoming events</h2>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">No events listed yet.</p>
          )}
          {!loading && events.length > 0 && (() => {
            const [heroEvent, ...restEvents] = events;
            return (
              <>
                <div className="mb-3 animate-fade-in">
                  <EventCard
                    event={heroEvent}
                    variant="hero"
                    href={`/evenements/${eventSlug(heroEvent.name, heroEvent.id)}`}
                    dateLabel={new Date(heroEvent.start_time).toLocaleString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  />
                </div>
                {restEvents.length > 0 && (
                  <EventCarousel
                    items={restEvents.map(e => ({
                      event: e,
                      href: `/evenements/${eventSlug(e.name, e.id)}`,
                      dateLabel: new Date(e.start_time).toLocaleString('en-GB', {
                        weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }),
                    }))}
                  />
                )}
              </>
            );
          })()}
        </section>

        <Link
          to={`/?city=${encodeURIComponent(cityName)}`}
          className="flex items-center justify-center gap-2 w-full sm:w-auto mt-6 mb-6 px-6 py-3.5 rounded-2xl bg-accent text-accent-foreground font-black text-base shadow-lg shadow-accent/40 active:scale-[0.98] transition-transform"
        >
          🗺️ Open the live {cityName} nightlife map
        </Link>

        <details className="group mb-2 rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between gap-2">
            <span>More about {cityName} nightlife</span>
            <span className="text-lg leading-none transition-transform group-open:rotate-45 text-accent" aria-hidden>+</span>
          </summary>
          <p className="mt-2 leading-relaxed">
            Looking for the best <strong>{cityName} nightlife</strong> tonight? PulseMap tracks
            every club, bar, concert, party and festival happening right now in {cityName} on a
            live interactive map — with times, venues and ticket links.
          </p>
        </details>

        <div className="mt-10 pt-8 border-t border-border/50 space-y-10">
        <section className="text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-bold text-foreground mb-2">Where to go out tonight in {cityName}</h2>
          <p>
            Whether you're after a techno party, a live concert, a festival, an afterwork or
            simply a lively bar, PulseMap gathers the best {cityName} nightlife spots in one
            place. The live map shows what's happening around you right now — times, venues,
            prices and tickets. No more juggling Shotgun, Ticketmaster or Facebook to find out
            where to go tonight in {cityName}.
          </p>
        </section>

        <section aria-labelledby="other-cities-h2">
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

        <section>
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
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          <Link to={`/sortir-ce-soir/${slug.toLowerCase()}`} className="underline">
            Version française : sortir ce soir à {cityName}
          </Link>
        </p>
      </main>
      <FloatingMapButton cityName={cityName} />
    </>
  );
}
