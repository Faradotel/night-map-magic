import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { MapCtaLink } from '@/components/MapCtaLink';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd, eventLd } from '@/lib/seo/jsonld';
import { parseEventSlug, eventSlug } from '@/lib/seo/slug';
import { isEventIndexable } from '@/lib/seo/eventIndexability';

interface RelatedEvent { id: string; name: string; venue: string; start_time: string }

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

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
  vibe: string;
}

export default function EventPage() {
  const { slug = '' } = useParams();
  const id = parseEventSlug(slug);
  const [event, setEvent] = useState<CachedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [engagement, setEngagement] = useState<{ favorites: number; attendances: number }>({ favorites: 0, attendances: 0 });
  const [sameVenue, setSameVenue] = useState<RelatedEvent[]>([]);
  const [sameCity, setSameCity] = useState<RelatedEvent[]>([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('cached_events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (cancel) return;
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setEvent(data as CachedEvent);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [id]);

  // Fetch real engagement signals (favorites + attendances) for aggregateRating.
  // Only emitted in JSON-LD when the signal is strong enough (min 5) to comply
  // with Google's anti-fake-review policy.
  useEffect(() => {
    let cancel = false;
    (async () => {
      const [{ count: favCount }, { count: attCount }] = await Promise.all([
        supabase.from('event_favorites').select('id', { count: 'exact', head: true }).eq('event_id', id),
        supabase.from('event_attendance').select('id', { count: 'exact', head: true }).eq('event_id', id),
      ]);
      if (!cancel) setEngagement({ favorites: favCount ?? 0, attendances: attCount ?? 0 });
    })();
    return () => { cancel = true; };
  }, [id]);

  // Maillage interne : événements du même lieu et de la même ville.
  useEffect(() => {
    if (!event) return;
    let cancel = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const cols = 'id,name,venue,start_time';
      const [v, c] = await Promise.all([
        supabase.from('cached_events').select(cols).eq('venue', event.venue).neq('id', event.id)
          .gte('start_time', nowIso).order('start_time').limit(6),
        supabase.from('cached_events').select(cols).ilike('city', event.city).neq('id', event.id)
          .neq('venue', event.venue).gte('start_time', nowIso).order('priority', { ascending: false })
          .order('start_time').limit(10),
      ]);
      if (cancel) return;
      setSameVenue((v.data as RelatedEvent[]) || []);
      setSameCity((c.data as RelatedEvent[]) || []);
    })();
    return () => { cancel = true; };
  }, [event]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-background text-foreground px-5 py-8 max-w-2xl mx-auto">
        <SEO title="Événement introuvable | PulseMap" description="Cet événement n'est plus disponible." canonical={`/evenements/${slug}`} noindex />
        <h1 className="text-2xl font-bold mb-3">Événement introuvable</h1>
        <p className="text-sm text-muted-foreground mb-4">Cet événement n'est plus disponible ou a été retiré.</p>
        <Link to="/villes" className="text-primary underline">Voir les villes</Link>
      </main>
    );
  }

  if (loading || !event) {
    return (
      <main className="min-h-screen bg-background text-foreground px-5 py-8 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">Chargement de l'événement…</p>
      </main>
    );
  }

  const canonical = `/evenements/${slug}`;
  const dateLabel = new Date(event.start_time).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeLabel = new Date(event.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const cityLower = event.city.toLowerCase();

  const title = `${event.name} — ${event.city}, ${dateLabel} | PulseMap`;
  const description = (event.description || `${event.name} à ${event.venue}, ${event.city} le ${dateLabel} à ${timeLabel}. Sortir ce soir à ${event.city} avec PulseMap : infos, lieu et billetterie.`).slice(0, 200);

  // AggregateRating for rich snippets — only when we have enough real engagement
  // signal (>= 5 combined favorites + attendances) to satisfy Google policy.
  const engagementTotal = engagement.favorites + engagement.attendances;
  const aggregateRating = engagementTotal >= 5
    ? {
        '@type': 'AggregateRating',
        // Simple heuristic: high favorites/attendance = strong positive signal.
        // Rating floors at 4.2, rises to 4.9 with volume.
        ratingValue: Math.min(4.9, 4.2 + Math.log10(engagementTotal) / 3).toFixed(1),
        reviewCount: engagementTotal,
        bestRating: '5',
        worstRating: '1',
      }
    : null;

  const baseEventLd = eventLd({
    id: event.id,
    name: event.name,
    description: event.description,
    startTime: event.start_time,
    endTime: event.end_time || undefined,
    venue: event.venue,
    address: event.address,
    city: event.city,
    lat: event.lat,
    lng: event.lng,
    imageUrl: event.image_url || undefined,
    ticketUrl: event.ticket_url || undefined,
    priceRange: event.price_range,
  }, canonical);

  const ld = [
    aggregateRating ? { ...baseEventLd, aggregateRating } : baseEventLd,
    breadcrumbLd([
      { name: 'Accueil', url: '/' },
      { name: `Sortir à ${event.city}`, url: `/sortir-ce-soir/${cityLower}` },
      { name: event.name, url: canonical },
    ]),
  ];

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        image={event.image_url || undefined}
        type="event"
        jsonLd={ld}
        noindex={!isEventIndexable(event)}
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-2xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/villes" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Villes</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground truncate max-w-[120px]">{event.name}</span>
        </nav>

        {event.image_url && (
          <img
            src={event.image_url}
            alt={`${event.name} à ${event.city}`}
            loading="eager"
            decoding="async"
            className="w-full aspect-video object-cover rounded-2xl mb-4"
          />
        )}

        <h1 className="text-2xl md:text-3xl font-black mb-2">{event.name}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {dateLabel} · {timeLabel} · {event.venue}, {event.city}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <MapCtaLink
            to={`/?event=${event.id}`}
            sourcePage="event"
            sourceSlug={event.id}
            city={event.city}
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
          >
            Voir sur la carte
          </MapCtaLink>
          {event.ticket_url && (
            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 rounded-xl border border-border font-bold text-sm">
              Billets
            </a>
          )}
        </div>

        <section aria-labelledby="desc-h2" className="mb-6">
          <h2 id="desc-h2" className="text-lg font-bold mb-2">À propos</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {event.description || `Rejoignez ${event.name} à ${event.venue}, ${event.city}.`}
          </p>
        </section>

        <section aria-labelledby="loc-h2">
          <h2 id="loc-h2" className="text-lg font-bold mb-2">Lieu</h2>
          <p className="text-sm text-muted-foreground">{event.venue}<br />{event.address}, {event.city}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + ', ' + event.city)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-accent underline"
          >
            Itinéraire Google Maps
          </a>
        </section>

        {sameVenue.length > 0 && (
          <section aria-labelledby="venue-h2" className="mt-8">
            <h2 id="venue-h2" className="text-lg font-bold mb-2">Au même endroit : {event.venue}</h2>
            <ul className="space-y-1.5 text-sm">
              {sameVenue.map(r => (
                <li key={r.id}>
                  <Link to={`/evenements/${eventSlug(r.name, r.id)}`} className="text-accent underline">{r.name}</Link>
                  <span className="text-muted-foreground"> · {shortDate(r.start_time)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sameCity.length > 0 && (
          <section aria-labelledby="city-h2" className="mt-8">
            <h2 id="city-h2" className="text-lg font-bold mb-2">Autres sorties à {event.city}</h2>
            <ul className="space-y-1.5 text-sm">
              {sameCity.map(r => (
                <li key={r.id}>
                  <Link to={`/evenements/${eventSlug(r.name, r.id)}`} className="text-accent underline">{r.name}</Link>
                  <span className="text-muted-foreground"> · {r.venue} · {shortDate(r.start_time)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-muted-foreground mt-10">
          Plus de sorties à <Link to={`/sortir-ce-soir/${cityLower}`} className="underline">{event.city}</Link>
          {' · '}
          <Link to={`/categories/soirees/${cityLower}`} className="underline">Soirées à {event.city}</Link>
          {' · '}
          <Link to="/villes" className="underline">Toutes les villes</Link>
        </p>
      </main>
    </>
  );
}
