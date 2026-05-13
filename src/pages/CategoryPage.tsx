import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { breadcrumbLd } from '@/lib/seo/jsonld';
import { CATEGORY_SLUGS, eventSlug } from '@/lib/seo/slug';

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
  const title = `${cat.label} en France — événements en direct | PulseMap`;

  return (
    <>
      <SEO
        title={title}
        description={cat.description}
        canonical={canonical}
        jsonLd={[breadcrumbLd([
          { name: 'Accueil', url: '/' },
          { name: 'Villes', url: '/villes' },
          { name: cat.label, url: canonical },
        ])]}
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-6 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/villes" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Catégories</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">{cat.label}</span>
        </nav>
        <h1 className="text-3xl font-black mb-2">{cat.label} en France</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{cat.description}</p>
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        <ul className="space-y-2">
          {events.map(e => (
            <li key={e.id}>
              <Link
                to={`/evenements/${eventSlug(e.name, e.id)}`}
                className="block p-3 rounded-xl border border-border bg-secondary hover:bg-accent/10"
              >
                <h2 className="font-bold text-sm">{e.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.start_time).toLocaleString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })} · {e.venue}, {e.city}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
