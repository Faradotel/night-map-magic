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
  const { slug = '', city: cityParam } = useParams();
  const cat = CATEGORY_SLUGS[slug.toLowerCase()];
  const citySlug = cityParam?.toLowerCase();
  const cityName = citySlug ? CITY_SLUGS[citySlug] : undefined;
  const cityValid = !citySlug || !!cityName;
  const [events, setEvents] = useState<CachedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cat || !cityValid) return;
    let cancel = false;
    (async () => {
      const nowIso = new Date().toISOString();
      let q = supabase
        .from('cached_events')
        .select('id,name,city,venue,start_time,type')
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

  if (!cat || !cityValid) return <Navigate to="/villes" replace />;

  const canonical = cityName
    ? `/categories/${slug.toLowerCase()}/${citySlug}`
    : `/categories/${slug.toLowerCase()}`;
  const labelLower = cat.label.toLowerCase();
  const singular = cat.label.replace(/s$/, '').toLowerCase();

  const title = cityName
    ? `${cat.label} ce soir à ${cityName} — agenda live | PulseMap`
    : `${cat.label} ce soir en France — agenda live | PulseMap`;
  const description = cityName
    ? `Tous les ${labelLower} ce soir à ${cityName} : carte temps réel, horaires, lieux et billetterie. Gratuit, sans inscription.`
    : `${cat.description} Carte temps réel des ${labelLower} ce soir partout en France. Gratuit, sans inscription.`;

  const h1 = cityName
    ? `${cat.label} ce soir à ${cityName}`
    : `${cat.label} ce soir en France`;

  const faqs = cityName ? [
    {
      q: `Où trouver un ${singular} ce soir à ${cityName} ?`,
      a: `PulseMap affiche en direct tous les ${labelLower} qui ont lieu ce soir à ${cityName} sur une carte interactive. Horaires, lieux exacts et liens de billetterie inclus.`,
    },
    {
      q: `Y a-t-il des ${labelLower} ce week-end à ${cityName} ?`,
      a: `Oui. Activez la catégorie « ${cat.label} » sur PulseMap et filtrez sur ${cityName} pour voir tous les ${labelLower} disponibles ce week-end avec horaires et lieux.`,
    },
    {
      q: `Comment voir les ${labelLower} à ${cityName} sur une carte ?`,
      a: `Ouvrez la carte PulseMap centrée sur ${cityName} : tous les ${labelLower} apparaissent géolocalisés en temps réel. Cliquez sur un marqueur pour les détails.`,
    },
  ] : [
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

  const breadcrumbs = cityName
    ? [
        { name: 'Accueil', url: '/' },
        { name: 'Villes', url: '/villes' },
        { name: cityName, url: `/sortir-ce-soir/${citySlug}` },
        { name: cat.label, url: canonical },
      ]
    : [
        { name: 'Accueil', url: '/' },
        { name: 'Villes', url: '/villes' },
        { name: cat.label, url: canonical },
      ];

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
        jsonLd={[breadcrumbLd(breadcrumbs), faqLd]}
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
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {cityName ? (
            <>Découvrez tous les <strong>{labelLower} ce soir à {cityName}</strong> sur PulseMap : carte temps réel, horaires précis, lieux et billetterie. Mis à jour en direct.</>
          ) : (
            <>{cat.description} <strong>PulseMap</strong> affiche en direct tous les {labelLower} disponibles ce soir partout en France, géolocalisés sur une carte interactive.</>
          )}
        </p>

        <Link
          to={mapHref}
          className="inline-block mb-6 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          Voir la carte des {labelLower}{cityName ? ` à ${cityName}` : ''}
        </Link>

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="text-xl font-bold mb-3">
            Prochains {labelLower}{cityName ? ` à ${cityName}` : ''}
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

        {cityName ? (
          <section className="mt-10" aria-labelledby="othercat-h2">
            <h2 id="othercat-h2" className="text-base font-bold text-foreground mb-3">
              Autres sorties à {cityName}
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              {otherCategories.map(([s, c]) => (
                <li key={s}>
                  <Link
                    to={`/categories/${s}/${citySlug}`}
                    className="block px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-sm"
                  >
                    <span className="font-semibold">{c.label} à {cityName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10" aria-labelledby="cities-h2">
          <h2 id="cities-h2" className="text-base font-bold text-foreground mb-3">
            {cat.label} par ville
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {cities.map(([cSlug, cName]) => (
              <li key={cSlug}>
                <Link
                  to={`/categories/${slug.toLowerCase()}/${cSlug}`}
                  className="block px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-sm"
                >
                  <span className="font-semibold">{cat.label} à {cName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-bold text-foreground mb-3">
            Questions fréquentes — {cat.label}{cityName ? ` à ${cityName}` : ''}
          </h2>
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
