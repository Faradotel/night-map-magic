import { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { buildCityMeta } from '@/lib/seo/pageMeta';
import { breadcrumbLd, eventLd, placeLd } from '@/lib/seo/jsonld';
import { CITY_SLUGS, CATEGORY_SLUGS, GENRE_SLUGS, VIBE_SLUGS, eventSlug } from '@/lib/seo/slug';
import { EventCard } from '@/components/EventCard';
import { EventCarousel } from '@/components/EventCarousel';
import { FloatingMapButton } from '@/components/FloatingMapButton';
import { MapCtaLink } from '@/components/MapCtaLink';
import { SeoChipList } from '@/components/SeoChipList';

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

interface CitySeoIntro {
  h1: string;
  intro_html: string;
  meta_description: string;
}

export default function CityPage() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const cityName = CITY_SLUGS[slug.toLowerCase()];
  const [events, setEvents] = useState<CachedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiIntro, setAiIntro] = useState<CitySeoIntro | null>(null);

  useEffect(() => {
    if (!cityName) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('city_seo_intros')
        .select('h1,intro_html,meta_description')
        .eq('city_slug', slug.toLowerCase())
        .maybeSingle();
      if (!cancel) setAiIntro((data as CitySeoIntro) || null);
    })();
    return () => { cancel = true; };
  }, [cityName, slug]);


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

  // Canonical: always /sortir-ce-soir/<slug>. Meta and JSON-LD built in
  // src/lib/seo/pageMeta.ts (shared with the build-time prerender).
  const isSortirRoute = location.pathname.startsWith('/sortir-ce-soir');
  const { canonical, topVenues, eventsCount, eventsCountLabel, title, description, ogTitle, ogDescription, faqs, ld, hreflang } =
    buildCityMeta({ slug, cityName, events, aiIntro, isSortirRoute });

  return (
    <>
      <SEO
        title={title}
        description={description}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        canonical={canonical}
        jsonLd={ld}
        hreflang={hreflang}
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/villes" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Villes</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">{cityName}</span>
        </nav>


        <h1 className="text-3xl font-black mb-2">
          {aiIntro?.h1 || `Soirée ${cityName} : où sortir ce soir ?`}
        </h1>
        {eventsCount > 0 && (
          <p className="text-base font-bold text-accent mb-4">
            {eventsCountLabel} {eventsCount === 1 ? 'sortie' : 'sorties'} à {cityName} ce soir
          </p>
        )}

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="sr-only">Sorties ce soir à {cityName} — prochains événements</h2>
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun événement référencé pour le moment.</p>
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
                    dateLabel={new Date(heroEvent.start_time).toLocaleString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  />
                </div>
                {restEvents.length > 0 && (
                  <EventCarousel
                    items={restEvents.map(e => ({
                      event: e,
                      href: `/evenements/${eventSlug(e.name, e.id)}`,
                      dateLabel: new Date(e.start_time).toLocaleString('fr-FR', {
                        weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }),
                    }))}
                  />
                )}
              </>
            );
          })()}
        </section>

        {events.length > 1 && (
          <section aria-labelledby="all-evts-h2" className="mt-6">
            <h2 id="all-evts-h2" className="text-lg font-bold mb-2">Tous les prochains événements à {cityName}</h2>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {events.slice(0, 30).map(e => (
                <li key={e.id} className="truncate">
                  <Link to={`/evenements/${eventSlug(e.name, e.id)}`} className="text-accent underline">{e.name}</Link>
                  <span className="text-muted-foreground"> · {e.venue}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <MapCtaLink
          to={`/?city=${encodeURIComponent(cityName)}`}
          sourcePage="city"
          sourceSlug={slug.toLowerCase()}
          city={cityName}
          className="flex items-center justify-center gap-2 w-full sm:w-auto mt-6 mb-6 px-6 py-3.5 rounded-2xl bg-accent text-accent-foreground font-black text-base shadow-lg shadow-accent/40 active:scale-[0.98] transition-transform"
        >
          🗺️ Voir la carte des sorties ce soir à {cityName}
        </MapCtaLink>

        <details className="group mb-2 rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between gap-2">
            <span>En savoir plus sur les sorties à {cityName}</span>
            <span className="text-lg leading-none transition-transform group-open:rotate-45 text-accent" aria-hidden>+</span>
          </summary>
          {aiIntro?.intro_html ? (
            <div
              className="mt-2 leading-relaxed space-y-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: aiIntro.intro_html }}
            />
          ) : (
            <p className="mt-2 leading-relaxed">
              Tu cherches <strong>où sortir ce soir à {cityName}</strong> ou une <strong>soirée à {cityName}</strong> ?
              PulseMap référence en temps réel tous les concerts, soirées, clubs, festivals et bars animés
              ouverts ce soir à {cityName}. La carte interactive te montre instantanément les meilleures
              sorties autour de toi, avec horaires, lieux et liens billetterie.
            </p>
          )}
        </details>

        <details className="group mt-4 mb-6 rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between gap-2">
            <span>Plus de sorties, genres et villes</span>
            <span className="text-lg leading-none transition-transform group-open:rotate-45 text-accent" aria-hidden>+</span>
          </summary>
          <div className="mt-3 space-y-8">
        {topVenues.length > 0 && (
          <section aria-labelledby="venues-h2">
            <h2 id="venues-h2" className="text-sm font-semibold text-muted-foreground mb-2">
              Lieux programmés en ce moment à {cityName}
            </h2>
            <p className="text-sm text-muted-foreground">{topVenues.join(' · ')}</p>
          </section>
        )}

        <section className="text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Sortir à {cityName} ce soir : que faire ?</h2>

          <p>
            Que tu cherches une soirée techno, un concert live, un festival, un afterwork ou
            simplement un bar animé pour <strong>sortir ce soir à {cityName}</strong>,
            PulseMap regroupe les meilleures sorties en un seul endroit. La carte interactive
            te montre en temps réel ce qui se passe autour de toi : horaires, lieux, prix et
            billetterie. Plus besoin de jongler entre plusieurs billetteries et réseaux sociaux : tout
            est centralisé pour trouver où sortir ce soir à {cityName} en quelques secondes.
          </p>
        </section>

        <section aria-labelledby="cats-h2">
          <h2 id="cats-h2" className="text-sm font-semibold text-muted-foreground mb-2">
            Par type de sortie à {cityName}
          </h2>
          <SeoChipList
            items={Object.entries(CATEGORY_SLUGS).map(([catSlug, cat]) => ({
              to: `/categories/${catSlug}/${slug}`,
              label: `${cat.label} à ${cityName}`,
            }))}
          />
        </section>

        <section aria-labelledby="genres-h2">
          <h2 id="genres-h2" className="text-sm font-semibold text-muted-foreground mb-2">
            Par genre musical à {cityName}
          </h2>
          <SeoChipList
            items={Object.entries(GENRE_SLUGS).map(([gSlug, g]) => ({
              to: `/genres/${gSlug}/${slug.toLowerCase()}`,
              label: `${g.label} à ${cityName}`,
            }))}
          />
        </section>

        <section aria-labelledby="vibes-h2">
          <h2 id="vibes-h2" className="text-sm font-semibold text-muted-foreground mb-2">
            Par ambiance à {cityName}
          </h2>
          <SeoChipList
            items={Object.entries(VIBE_SLUGS).map(([vSlug, v]) => ({
              to: `/ambiances/${vSlug}/${slug.toLowerCase()}`,
              label: `${v.label} à ${cityName}`,
            }))}
          />
        </section>

        <section aria-labelledby="other-cities-h2">
          <h2 id="other-cities-h2" className="text-sm font-semibold text-muted-foreground mb-2">
            Sortir ce soir dans d'autres villes
          </h2>
          <SeoChipList
            items={Object.entries(CITY_SLUGS).filter(([s]) => s !== slug.toLowerCase()).map(([s, n]) => ({
              to: `/sortir-ce-soir/${s}`,
              label: n,
            }))}
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Questions fréquentes — sortir ce soir à {cityName}</h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-background p-3">
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
        </details>
      </main>
      <FloatingMapButton cityName={cityName} citySlug={slug.toLowerCase()} />
    </>
  );
}
