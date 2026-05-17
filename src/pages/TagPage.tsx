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

  if (cityMissing) return <Navigate to={`/${kind === 'genre' ? 'genres' : 'ambiances'}/${tagSlug}`} replace />;
  if (!tag) return <Navigate to="/villes" replace />;

  const prefix = kind === 'genre' ? 'genres' : 'ambiances';
  const kindLabel = kind === 'genre' ? 'Genre' : 'Ambiance';
  const tagLower = tag.label.toLowerCase();

  const canonical = cityName
    ? `/${prefix}/${tagSlug}/${citySlug}`
    : `/${prefix}/${tagSlug}`;

  const title = cityName
    ? `${tag.label} à ${cityName} : sortir ce soir | PulseMap`
    : `${tag.label} en France : sortir ce soir | PulseMap`;

  const description = cityName
    ? `Soirées et événements ${tagLower} à ${cityName} ce soir. PulseMap affiche en temps réel toutes les sorties ${tagLower} à ${cityName} sur une carte interactive.`
    : `Soirées et événements ${tagLower} ce soir en France. PulseMap référence tous les événements ${tagLower} géolocalisés sur une carte temps réel.`;

  const h1 = cityName
    ? `${tag.label} à ${cityName} ce soir`
    : `${tag.label} en France ce soir`;

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

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        jsonLd={[breadcrumbLd(breadcrumbs)]}
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
              Tu cherches une soirée <strong>{tagLower} à {cityName}</strong> ? PulseMap référence
              en temps réel tous les événements {tagLower} ouverts ce soir à {cityName}.
            </>
          ) : (
            <>
              Tous les événements <strong>{tagLower}</strong> ce soir en France, en direct sur une
              carte interactive. Filtre par ville pour trouver une sortie {tagLower} près de toi.
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
