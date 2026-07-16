import { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd } from '@/lib/seo/jsonld';
import {
  CITY_SLUGS,
  GENRE_SLUGS,
  VIBE_SLUGS,
  eventSlug,
} from '@/lib/seo/slug';

interface CachedEvent {
  id: string; name: string; city: string; venue: string;
  start_time: string; vibe: string; genres: string[] | null;
}

type Kind = 'genre' | 'vibe';

interface TagDef {
  label: string;
  description: string;
  filter: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>;
}

function resolveTag(kind: Kind, slug: string): TagDef | null {
  if (kind === 'genre') {
    const g = GENRE_SLUGS[slug];
    if (!g) return null;
    return {
      label: g.label,
      description: g.description,
      filter: (q: any) => q.overlaps('genres', g.dbValues),
    };
  }
  const v = VIBE_SLUGS[slug];
  if (!v) return null;
  return {
    label: v.label,
    description: v.description,
    filter: (q: any) => q.eq('vibe', v.dbValue),
  };
}

export default function TagPage({ kind }: { kind: Kind }) {
  const { slug = '', city = '' } = useParams();
  const location = useLocation();
  const tagSlug = slug.toLowerCase();
  const citySlug = city.toLowerCase();

  const tag = resolveTag(kind, tagSlug);
  const cityName = citySlug ? CITY_SLUGS[citySlug] : null;
  const cityMissing = !!citySlug && !cityName;

  const [events, setEvents] = useState<CachedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag || cityMissing) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      let query: any = supabase
        .from('cached_events')
        .select('id,name,city,venue,start_time,vibe,genres');
      query = tag.filter(query);
      if (cityName) query = query.ilike('city', cityName);
      query = query
        .or(`start_time.gte.${nowIso},end_time.gte.${nowIso}`)
        .order('start_time', { ascending: true })
        .limit(60);
      const { data } = await query;
      if (!cancel) {
        setEvents((data as CachedEvent[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [tagSlug, citySlug, kind]);

  // URLs invalides (mauvaise ville, mauvais tag) : on renvoie une page noindex
  // au lieu de rediriger. Google supprime ces URLs de son index au lieu de les
  // classer "Page avec redirection" et de les recrawler indéfiniment.
  if (cityMissing || !tag) {
    return (
      <>
        <SEO
          title="Page introuvable | PulseMap"
          description="Cette page n'existe pas ou plus."
          canonical={location.pathname}
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

  const prefix = kind === 'genre' ? 'genres' : 'ambiances';
  const kindLabel = kind === 'genre' ? 'Genre' : 'Ambiance';
  const tagLower = tag.label.toLowerCase();

  const canonical = cityName
    ? `/${prefix}/${tagSlug}/${citySlug}`
    : `/${prefix}/${tagSlug}`;

  const kindKeyword = kind === 'genre' ? tagLower : `soirée ${tagLower}`;

  const title = cityName
    ? `Soirée ${tag.label} à ${cityName} ce soir : où sortir ?`
    : `Soirée ${tag.label} ce soir en France : agenda live`;

  const description = cityName
    ? `Où sortir en soirée ${tagLower} à ${cityName} ce soir ? PulseMap liste tous les clubs, DJ sets et events ${tagLower} à ${cityName} ce soir sur une carte temps réel. ${tag.description}`
    : `Toutes les soirées ${tagLower} ce soir en France : clubs, DJ sets, raves et events ${tagLower} géolocalisés sur une carte temps réel. ${tag.description}`;

  const h1 = cityName
    ? `Soirée ${tag.label} à ${cityName} ce soir`
    : `Soirée ${tag.label} ce soir en France`;

  const cities = Object.entries(CITY_SLUGS);

  const breadcrumbs = cityName
    ? [
        { name: 'Accueil', url: '/' },
        { name: kindLabel + 's', url: '/villes' },
        { name: tag.label, url: `/${prefix}/${tagSlug}` },
        { name: cityName, url: canonical },
      ]
    : [
        { name: 'Accueil', url: '/' },
        { name: kindLabel + 's', url: '/villes' },
        { name: tag.label, url: canonical },
      ];

  const faqs = cityName ? [
    {
      q: `Où trouver une soirée ${tagLower} à ${cityName} ce soir ?`,
      a: `PulseMap référence en temps réel tous les clubs, DJ sets et events ${tagLower} à ${cityName} ce soir sur une carte interactive avec horaires, lieux et billetterie.`,
    },
    {
      q: `Y a-t-il une soirée ${tagLower} ce week-end à ${cityName} ?`,
      a: `Oui. Sélectionne « ${tag.label} » sur PulseMap et filtre ${cityName} pour voir toutes les soirées ${tagLower} du week-end à ${cityName}.`,
    },
    {
      q: `Quels clubs ${tagLower} à ${cityName} ?`,
      a: `PulseMap affiche les clubs et lieux ${tagLower} actifs ce soir à ${cityName}, avec les DJ programmés, l'adresse exacte et le lien vers la billetterie.`,
    },
  ] : [
    {
      q: `Où trouver une soirée ${tagLower} en France ce soir ?`,
      a: `PulseMap référence en temps réel toutes les soirées ${tagLower} partout en France sur une carte interactive. Filtre par ville pour trouver un event ${tagLower} près de toi.`,
    },
    {
      q: `Comment voir les soirées ${tagLower} sur une carte ?`,
      a: `Ouvre PulseMap, active le filtre « ${tag.label} » : tous les events ${tagLower} apparaissent géolocalisés en temps réel avec horaires et lieux.`,
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

  // Auto-noindex des pages tag×ville vides : Google marque sinon la page
  // "Explorée, actuellement non indexée" et la recrawle indéfiniment.
  const emptyCityPage = !!cityName && !loading && events.length === 0;

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        noindex={emptyCityPage}
        jsonLd={[breadcrumbLd(breadcrumbs), faqLd]}
      />

      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to={`/${prefix}/${tagSlug}`} className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">{tag.label}</Link>
          {cityName && (
            <>
              <span>/</span>
              <span className="px-3 py-1.5 font-medium text-foreground">{cityName}</span>
            </>
          )}
        </nav>

        <h1 className="text-3xl font-black mb-2">{h1}</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {cityName ? (
            <>
              Tu cherches <strong>où sortir en soirée {tagLower} à {cityName}</strong> ce soir ?
              PulseMap regroupe en temps réel tous les clubs, DJ sets, raves et events {tagLower}
              ouverts ce soir à {cityName}, géolocalisés sur une carte interactive avec horaires,
              lieux exacts et billetterie. La façon la plus rapide de trouver une soirée {tagLower}
              à {cityName} sans jongler entre Shotgun, Resident Advisor et Facebook.
            </>
          ) : (
            <>
              Tous les <strong>events {tagLower}</strong> ce soir en France, en direct sur une
              carte interactive. Clubs, raves, DJ sets et soirées {tagLower} filtrables par ville,
              horaire et distance. Choisis ta ville ci-dessous pour trouver ta soirée {tagLower}.
            </>
          )}
        </p>


        <Link
          to={`/?${kind === 'genre' ? 'genre' : 'vibe'}=${tagSlug}${cityName ? `&city=${encodeURIComponent(cityName)}` : ''}`}
          className="inline-block mb-6 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          Voir sur la carte
        </Link>

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="text-xl font-bold mb-3">
            {cityName ? `Prochains événements ${tagLower} à ${cityName}` : `Prochains événements ${tagLower}`}
          </h2>
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun événement référencé pour le moment.</p>
          )}
          <ul className="space-y-2">
            {events.map(e => (
              <li key={e.id}>
                <Link
                  to={`/evenements/${eventSlug(e.name, e.id)}`}
                  className="block p-3 rounded-xl border border-border bg-secondary hover:bg-accent/10"
                >
                  <h3 className="font-bold text-sm">{e.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.start_time).toLocaleString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })} · {e.venue}, {e.city}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {!cityName && (
          <section className="mt-10" aria-labelledby="cities-h2">
            <h2 id="cities-h2" className="text-base font-bold text-foreground mb-3">
              {tag.label} par ville
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              {cities.map(([s, n]) => (
                <li key={s}>
                  <Link
                    to={`/${prefix}/${tagSlug}/${s}`}
                    className="block px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-sm"
                  >
                    <span className="font-semibold">{tag.label} à {n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cityName && (
          <section className="mt-10" aria-labelledby="more-h2">
            <h2 id="more-h2" className="text-base font-bold text-foreground mb-3">
              Plus de sorties à {cityName}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link to={`/sortir-ce-soir/${citySlug}`} className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-medium">
                Toutes les sorties ce soir à {cityName}
              </Link>
              <Link to={`/${prefix}/${tagSlug}`} className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-medium">
                {tag.label} dans toute la France
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
