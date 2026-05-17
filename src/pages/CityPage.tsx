import { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
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

export default function CityPage() {
  const { slug = '' } = useParams();
  const location = useLocation();
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

  // Canonical: always point to /sortir-ce-soir/<slug> — it's the URL we want
  // Google to rank for the high-intent query "où sortir ce soir à <ville>".
  // /villes/<slug> consolidates its signals into the canonical URL.
  const canonical = `/sortir-ce-soir/${slug.toLowerCase()}`;
  const isSortirRoute = location.pathname.startsWith('/sortir-ce-soir');
  const title = isSortirRoute
    ? `Où sortir ce soir à ${cityName} ? Concerts, soirées & bars`
    : `Sortir ce soir à ${cityName} : que faire ? | PulseMap`;
  const description = `Où sortir ce soir à ${cityName} ? Carte temps réel des concerts, soirées, clubs, festivals et bars animés ouverts ce soir à ${cityName}. Gratuit, sans inscription.`;
  const ogTitle = `Où sortir ce soir à ${cityName} — Concerts, soirées & clubs live`;
  const ogDescription = `Tu cherches où sortir ce soir à ${cityName} ? PulseMap te montre tous les événements live ce soir sur une carte interactive. Gratuit, sans inscription.`;

  const faqs = [
    {
      q: `Où sortir ce soir à ${cityName} ?`,
      a: `Pour sortir ce soir à ${cityName}, PulseMap affiche en temps réel tous les concerts, soirées, clubs, bars animés et festivals ouverts ce soir à ${cityName} sur une carte interactive. Filtre par type, distance ou horaire pour trouver la sortie idéale.`,
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
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/villes" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Villes</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">{cityName}</span>
        </nav>

        <h1 className="text-3xl font-black mb-2">Où sortir ce soir à {cityName} ?</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Tu cherches <strong>où sortir ce soir à {cityName}</strong> ? PulseMap référence
          en temps réel tous les concerts, soirées, clubs, festivals et bars animés ouverts
          ce soir à {cityName}. La carte interactive te montre instantanément les meilleures
          sorties autour de toi, avec horaires, lieux et liens billetterie.
        </p>

        <Link
          to={`/?city=${encodeURIComponent(cityName)}`}
          className="inline-block mb-6 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          Voir la carte des sorties ce soir à {cityName}
        </Link>

        <section aria-labelledby="evts-h2">
          <h2 id="evts-h2" className="text-xl font-bold mb-3">Sorties ce soir à {cityName} — prochains événements</h2>
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun événement référencé pour le moment.</p>
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
                    {new Date(e.start_time).toLocaleString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })} · {e.venue}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-bold text-foreground mb-2">Où sortir ce soir à {cityName} ?</h2>
          <p>
            Que tu cherches une soirée techno, un concert live, un festival, un afterwork ou
            simplement un bar animé pour <strong>sortir ce soir à {cityName}</strong>,
            PulseMap regroupe les meilleures sorties en un seul endroit. La carte interactive
            te montre en temps réel ce qui se passe autour de toi : horaires, lieux, prix et
            billetterie. Plus besoin de jongler entre Shotgun, Ticketmaster ou Facebook — tout
            est centralisé pour trouver où sortir ce soir à {cityName} en quelques secondes.
          </p>
        </section>

        <section className="mt-10">
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
      </main>
    </>
  );
}
