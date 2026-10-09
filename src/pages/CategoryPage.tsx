import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { buildCategoryMeta } from '@/lib/seo/pageMeta';
import { breadcrumbLd } from '@/lib/seo/jsonld';
import { CATEGORY_SLUGS, CITY_SLUGS, GENRE_SLUGS, VIBE_SLUGS, eventSlug } from '@/lib/seo/slug';
import { SITE } from '@/components/SEO';
import { MapCtaLink } from '@/components/MapCtaLink';
import { EventCard } from '@/components/EventCard';
import { EventCarousel } from '@/components/EventCarousel';
import { SeoChipList } from '@/components/SeoChipList';

interface CachedEvent {
  id: string; name: string; city: string; venue: string;
  start_time: string; type: string;
  price_range: string; vibe: string; image_url: string | null; image_color: string;
}

interface CitySeoIntro {
  h1: string;
  intro_html: string;
  meta_description: string;
}

export default function CategoryPage() {
  const { slug = '', city: cityParam } = useParams();
  const cat = CATEGORY_SLUGS[slug.toLowerCase()];
  const citySlug = cityParam?.toLowerCase();
  const cityName = citySlug ? CITY_SLUGS[citySlug] : undefined;
  const cityValid = !citySlug || !!cityName;
  const [events, setEvents] = useState<CachedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiIntro, setAiIntro] = useState<CitySeoIntro | null>(null);

  useEffect(() => {
    if (!cat || !cityValid) return;
    let cancel = false;
    (async () => {
      const nowIso = new Date().toISOString();
      let q = supabase
        .from('cached_events')
        .select('id,name,city,venue,start_time,type,price_range,vibe,image_url,image_color')
        .in('type', cat.types)
        .or(`start_time.gte.${nowIso},end_time.gte.${nowIso}`)
        .order('start_time', { ascending: true })
        .limit(80);
      if (cityName) q = q.ilike('city', cityName);
      const { data } = await q;
      if (!cancel) { setEvents((data as CachedEvent[]) || []); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [slug, cat, cityName, cityValid]);

  // Fetch AI-generated unique intro for this city (only for the "soirees" category — main SEO target).
  useEffect(() => {
    if (!citySlug || slug.toLowerCase() !== 'soirees') { setAiIntro(null); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('city_seo_intros')
        .select('h1,intro_html,meta_description')
        .eq('city_slug', citySlug)
        .maybeSingle();
      if (!cancel && data) setAiIntro(data as CitySeoIntro);
    })();
    return () => { cancel = true; };
  }, [citySlug, slug]);

  if (!cat || !cityValid) {
    const pathname = citySlug
      ? `/categories/${slug.toLowerCase()}/${citySlug}`
      : `/categories/${slug.toLowerCase()}`;
    return (
      <>
        <SEO
          title="Page introuvable | PulseMap"
          description="Cette page n'existe pas ou plus."
          canonical={pathname}
          noindex
        />
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
          <h1 className="text-2xl font-black mb-3">Page introuvable</h1>
          <p className="text-sm text-muted-foreground mb-6">Cette page n'existe pas ou plus.</p>
          <Link to="/villes" className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm">
            Explorer les villes
          </Link>
        </main>
      </>
    );
  }

  // Meta, FAQ and JSON-LD built in src/lib/seo/pageMeta.ts (shared with the prerender).
  const { canonical, labelLower, isSoirees, title, description, h1, faqs, jsonLd, emptyCityPage } =
    buildCategoryMeta({ slug, cat, citySlug, cityName, events, aiIntro, loading });

  const todayFr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });



  const cities = Object.entries(CITY_SLUGS);
  const otherCategories = Object.entries(CATEGORY_SLUGS).filter(([s]) => s !== slug.toLowerCase());

  const mapHref = cityName
    ? `/?category=${slug.toLowerCase()}&city=${citySlug}`
    : `/?category=${slug.toLowerCase()}`;


  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        noindex={emptyCityPage}
        jsonLd={jsonLd}
      />

      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5 flex-wrap">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/villes" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Catégories</Link>
          {cityName && (
            <>
              <span>/</span>
              <Link to={`/sortir-ce-soir/${citySlug}`} className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">{cityName}</Link>
            </>
          )}
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">{cat.label}</span>
        </nav>

        <h1 className="text-3xl font-black mb-2">{h1}</h1>
        {/* Signal de fraîcheur : Google adore les pages datées. */}
        <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-3">
          Mis à jour · {todayFr}
        </p>
        {aiIntro?.intro_html ? (
          <div
            className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed mb-6 [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: aiIntro.intro_html }}
          />
        ) : (
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {isSoirees && cityName ? (
              <><strong>Soirée {cityName}</strong> ce soir : PulseMap regroupe toutes les soirées, clubs, DJ sets, techno, électro, house, hip-hop, afterworks et bars animés à {cityName} — géolocalisés sur une carte temps réel, avec horaires et billetterie. La façon la plus rapide de trouver <strong>où sortir ce soir à {cityName}</strong>.</>
            ) : isSoirees ? (
              <>Tu cherches <strong>où sortir ce soir</strong> ? PulseMap regroupe toutes les <strong>soirées</strong> de ce soir en France : clubs, DJ sets, techno, électro, afterworks et bars animés géolocalisés sur une carte temps réel, avec horaires et billetterie.</>
            ) : cityName ? (
              <>Découvrez tous les <strong>{labelLower} ce soir à {cityName}</strong> sur PulseMap : carte temps réel, horaires précis, lieux et billetterie. Mis à jour en direct.</>
            ) : (
              <>{cat.description} <strong>PulseMap</strong> affiche en direct tous les {labelLower} disponibles ce soir partout en France, géolocalisés sur une carte interactive.</>
            )}
          </p>
        )}


        <MapCtaLink
          to={mapHref}
          sourcePage="category"
          sourceSlug={slug.toLowerCase()}
          city={cityName}
          className="inline-block mb-6 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          Voir la carte des {labelLower}{cityName ? ` à ${cityName}` : ''}
        </MapCtaLink>

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="text-xl font-bold mb-3">
            {isSoirees && cityName
              ? `Soirée ${cityName} : les prochains events`
              : `Prochains ${labelLower}${cityName ? ` à ${cityName}` : ''}`}
          </h2>

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

        <details className="group mt-8 mb-2 rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between gap-2">
            <span>Plus de sorties et villes</span>
            <span className="text-lg leading-none transition-transform group-open:rotate-45 text-accent" aria-hidden>+</span>
          </summary>
          <div className="mt-3 space-y-8">
        {cityName ? (
          <section aria-labelledby="othercat-h2">
            <h2 id="othercat-h2" className="text-sm font-semibold text-muted-foreground mb-2">
              Autres sorties à {cityName}
            </h2>
            <SeoChipList
              items={otherCategories.map(([s, c]) => ({
                to: `/categories/${s}/${citySlug}`,
                label: `${c.label} à ${cityName}`,
              }))}
            />
          </section>
        ) : null}

        {isSoirees && cityName && (
          <>
            <section aria-labelledby="genres-h2">
              <h2 id="genres-h2" className="text-sm font-semibold text-muted-foreground mb-2">
                Soirées par genre musical à {cityName}
              </h2>
              <SeoChipList
                items={Object.entries(GENRE_SLUGS).map(([gSlug, g]) => ({
                  to: `/genres/${gSlug}/${citySlug}`,
                  label: `Soirée ${g.label} ${cityName}`,
                }))}
              />
            </section>

            <section aria-labelledby="vibes-h2">
              <h2 id="vibes-h2" className="text-sm font-semibold text-muted-foreground mb-2">
                Soirées par ambiance à {cityName}
              </h2>
              <SeoChipList
                items={Object.entries(VIBE_SLUGS).map(([vSlug, v]) => ({
                  to: `/ambiances/${vSlug}/${citySlug}`,
                  label: `${v.label} ${cityName}`,
                }))}
              />
            </section>
          </>
        )}

        <section aria-labelledby="cities-h2">
          <h2 id="cities-h2" className="text-sm font-semibold text-muted-foreground mb-2">
            {cat.label} par ville
          </h2>
          <SeoChipList
            items={cities.map(([cSlug, cName]) => ({
              to: `/categories/${slug.toLowerCase()}/${cSlug}`,
              label: `${cat.label} à ${cName}`,
            }))}
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Questions fréquentes — {cat.label}{cityName ? ` à ${cityName}` : ''}
          </h2>
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
    </>
  );
}
