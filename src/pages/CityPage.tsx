import { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd, eventLd, placeLd } from '@/lib/seo/jsonld';
import { CITY_SLUGS, CATEGORY_SLUGS, GENRE_SLUGS, VIBE_SLUGS, eventSlug } from '@/lib/seo/slug';
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

  // Canonical: always point to /sortir-ce-soir/<slug> — it's the URL we want
  // Google to rank for the high-intent query "où sortir ce soir à <ville>".
  // /villes/<slug> consolidates its signals into the canonical URL.
  const canonical = `/sortir-ce-soir/${slug.toLowerCase()}`;
  const isSortirRoute = location.pathname.startsWith('/sortir-ce-soir');

  // Lieux récurrents réellement programmés — contenu unique par ville
  // (Google distingue ainsi cette page d'un template dupliqué 115 fois).
  const topVenues = [...new Set(events.map(e => e.venue).filter(Boolean))].slice(0, 8);
  const eventsCount = events.length;
  const eventsCountLabel = eventsCount === 60 ? '60+' : String(eventsCount);

  // Le titre couvre les 3 variantes qui ont du volume : « soirée <ville> »,
  // « sortir à <ville> » et « <ville> ce soir ».
  const title = isSortirRoute
    ? `Soirée ${cityName} : sortir ce soir à ${cityName}`
    : `Sortir ce soir à ${cityName} : que faire ? | PulseMap`;
  const description = aiIntro?.meta_description
    ? aiIntro.meta_description
    : eventsCount > 0
    ? `${eventsCount} sorties à ${cityName} ce soir et dans les jours à venir : soirées, concerts, clubs et bars${topVenues.length ? ` (${topVenues.slice(0, 2).join(', ')})` : ''}. Carte live, gratuit sans inscription.`
    : `Où sortir ce soir à ${cityName} ? Carte temps réel des concerts, soirées, clubs, festivals et bars animés ouverts ce soir à ${cityName}. Gratuit, sans inscription.`;

  const ogTitle = `Soirée ${cityName} — Où sortir ce soir à ${cityName} ?`;
  const ogDescription = `Tu cherches où sortir ce soir à ${cityName} ? PulseMap te montre tous les événements live ce soir sur une carte interactive. Gratuit, sans inscription.`;


  const faqs = [
    {
      q: `Où sortir ce soir à ${cityName} ?`,
      a: `Pour sortir ce soir à ${cityName}, PulseMap affiche en temps réel tous les concerts, soirées, clubs, bars animés et festivals ouverts ce soir à ${cityName} sur une carte interactive. Filtre par type, distance ou horaire pour trouver la sortie idéale.`,
    },
    {
      q: `Quelle soirée à ${cityName} ce soir ?`,
      a: topVenues.length
        ? `Ce soir à ${cityName}, des soirées sont programmées notamment à ${topVenues.slice(0, 4).join(', ')}. PulseMap liste ${eventsCount} sorties à venir à ${cityName} avec horaires, adresse exacte et billetterie.`
        : `PulseMap liste en direct toutes les soirées, clubs et DJ sets programmés à ${cityName}, avec horaires, adresse exacte et lien billetterie.`,
    },
    {
      q: `Que faire ce soir à ${cityName} ?`,
      a: `Ce soir à ${cityName}, tu peux profiter de concerts live, soirées électro et techno, clubs, afterworks, festivals, expos nocturnes ou simplement un bar animé. Tous les événements sont géolocalisés et mis à jour en continu sur PulseMap.`,
    },
    {
      q: `Comment trouver une soirée ce soir à ${cityName} ?`,
      a: `Ouvre PulseMap, sélectionne ${cityName} et active le filtre « ce soir ». La carte affiche immédiatement toutes les soirées disponibles ce soir à ${cityName} avec les horaires, le lieu et le lien vers la billetterie.`,
    },
    {
      q: `PulseMap est-il gratuit pour découvrir les sorties à ${cityName} ?`,
      a: `Oui, PulseMap est 100 % gratuit. Tu peux consulter la carte des sorties à ${cityName} sans inscription, et créer un compte uniquement pour les fonctionnalités sociales (amis, check-ins, badges).`,
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
      { name: 'Accueil', url: '/' },
      { name: 'Villes', url: '/villes' },
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
          { lang: 'fr', path: canonical },
          { lang: 'en', path: `/en/nightlife/${slug.toLowerCase()}` },
          { lang: 'x-default', path: canonical },
        ]}
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

        <Link
          to={`/?city=${encodeURIComponent(cityName)}`}
          className="flex items-center justify-center gap-2 w-full sm:w-auto mt-6 mb-6 px-6 py-3.5 rounded-2xl bg-accent text-accent-foreground font-black text-base shadow-lg shadow-accent/40 active:scale-[0.98] transition-transform"
        >
          🗺️ Voir la carte des sorties ce soir à {cityName}
        </Link>

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

        <div className="mt-10 pt-8 border-t border-border/50 space-y-10">
        {topVenues.length > 0 && (
          <section aria-labelledby="venues-h2">
            <h2 id="venues-h2" className="text-base font-bold text-foreground mb-3">
              Où sortir à {cityName} : les lieux programmés en ce moment
            </h2>
            <ul className="flex flex-wrap gap-2">
              {topVenues.map(v => (
                <li
                  key={v}
                  className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs font-medium"
                >
                  {v}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-bold text-foreground mb-2">Sortir à {cityName} ce soir : que faire ?</h2>

          <p>
            Que tu cherches une soirée techno, un concert live, un festival, un afterwork ou
            simplement un bar animé pour <strong>sortir ce soir à {cityName}</strong>,
            PulseMap regroupe les meilleures sorties en un seul endroit. La carte interactive
            te montre en temps réel ce qui se passe autour de toi : horaires, lieux, prix et
            billetterie. Plus besoin de jongler entre Shotgun, Ticketmaster ou Facebook — tout
            est centralisé pour trouver où sortir ce soir à {cityName} en quelques secondes.
          </p>
        </section>

        <section aria-labelledby="cats-h2">
          <h2 id="cats-h2" className="text-base font-bold text-foreground mb-3">
            Par type de sortie à {cityName}
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_SLUGS).map(([catSlug, cat]) => (
              <li key={catSlug}>
                <Link
                  to={`/categories/${catSlug}/${slug}`}
                  className="block px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-sm"
                >
                  <span className="font-semibold">{cat.label} à {cityName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="genres-h2">
          <h2 id="genres-h2" className="text-base font-bold text-foreground mb-3">
            Par genre musical à {cityName}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(GENRE_SLUGS).map(([gSlug, g]) => (
              <li key={gSlug}>
                <Link
                  to={`/genres/${gSlug}/${slug.toLowerCase()}`}
                  className="inline-block px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-medium"
                >
                  {g.label} à {cityName}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="vibes-h2">
          <h2 id="vibes-h2" className="text-base font-bold text-foreground mb-3">
            Par ambiance à {cityName}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(VIBE_SLUGS).map(([vSlug, v]) => (
              <li key={vSlug}>
                <Link
                  to={`/ambiances/${vSlug}/${slug.toLowerCase()}`}
                  className="inline-block px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-medium"
                >
                  {v.label} à {cityName}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="other-cities-h2">
          <h2 id="other-cities-h2" className="text-base font-bold text-foreground mb-3">
            Sortir ce soir dans d'autres villes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(CITY_SLUGS).filter(([s]) => s !== slug.toLowerCase()).map(([s, n]) => (
              <li key={s}>
                <Link
                  to={`/sortir-ce-soir/${s}`}
                  className="inline-block px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-medium"
                >
                  {n}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-3">Questions fréquentes — sortir ce soir à {cityName}</h2>
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
      </main>
      <FloatingMapButton cityName={cityName} />
    </>
  );
}
