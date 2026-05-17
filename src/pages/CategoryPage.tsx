import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd } from '@/lib/seo/jsonld';
import { CATEGORY_SLUGS, CITY_SLUGS, eventSlug } from '@/lib/seo/slug';

interface CachedEvent {
  id: string; name: string; city: string; venue: string;
  start_time: string; type: string;
}

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const cat = CATEGORY_SLUGS[slug.toLowerCase()];
  const [events, setEvents] = useState<CachedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cat) return;
    let cancel = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from('cached_events')
        .select('id,name,city,venue,start_time,type')
        .in('type', cat.types)
        .or(`start_time.gte.${nowIso},end_time.gte.${nowIso}`)
        .order('start_time', { ascending: true })
        .limit(80);
      if (!cancel) { setEvents((data as CachedEvent[]) || []); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [slug, cat]);

  if (!cat) return <Navigate to="/villes" replace />;

  const canonical = `/categories/${slug.toLowerCase()}`;
  const labelLower = cat.label.toLowerCase();
  const title = `${cat.label} ce soir en France — agenda live | PulseMap`;
  const description = `${cat.description} Carte temps réel des ${labelLower} ce soir partout en France. Gratuit, sans inscription.`;

  const faqs = [
    {
      q: `Où trouver des ${labelLower} ce soir en France ?`,
      a: `PulseMap référence en direct tous les ${labelLower} qui ont lieu ce soir partout en France sur une carte interactive. Filtrez par ville, distance ou horaire pour trouver l'événement idéal.`,
    },
    {
      q: `Comment savoir s'il y a des ${labelLower} ce week-end près de chez moi ?`,
      a: `Ouvrez PulseMap, activez la catégorie « ${cat.label} » et la carte affiche immédiatement tous les ${labelLower} disponibles autour de vous avec horaires, lieux et billetterie.`,
    },
    {
      q: `PulseMap est-il gratuit pour consulter les ${labelLower} ?`,
      a: `Oui, PulseMap est 100 % gratuit. Vous pouvez consulter tous les ${labelLower} référencés sans inscription.`,
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

  const cities = Object.entries(CITY_SLUGS);

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        jsonLd={[
          breadcrumbLd([
            { name: 'Accueil', url: '/' },
            { name: 'Villes', url: '/villes' },
            { name: cat.label, url: canonical },
          ]),
          faqLd,
        ]}
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/villes" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Catégories</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">{cat.label}</span>
        </nav>

        <h1 className="text-3xl font-black mb-2">{cat.label} ce soir en France</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {cat.description} <strong>PulseMap</strong> affiche en direct tous les {labelLower} disponibles
          ce soir partout en France, géolocalisés sur une carte interactive.
        </p>

        <Link
          to={`/?category=${slug.toLowerCase()}`}
          className="inline-block mb-6 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          Voir la carte des {labelLower}
        </Link>

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="text-xl font-bold mb-3">Prochains {labelLower}</h2>
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

        <section className="mt-10" aria-labelledby="cities-h2">
          <h2 id="cities-h2" className="text-base font-bold text-foreground mb-3">
            {cat.label} par ville
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {cities.map(([citySlug, cityName]) => (
              <li key={citySlug}>
                <Link
                  to={`/sortir-ce-soir/${citySlug}`}
                  className="block px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-sm"
                >
                  <span className="font-semibold">{cat.label} à {cityName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-bold text-foreground mb-3">Questions fréquentes — {cat.label}</h2>
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
      </main>
    </>
  );
}
