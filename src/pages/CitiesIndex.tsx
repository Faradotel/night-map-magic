import { Link } from 'react-router-dom';
import { SEO, SITE } from '@/components/SEO';
import { breadcrumbLd, organizationLd, websiteLd } from '@/lib/seo/jsonld';
import { CITY_SLUGS, CATEGORY_SLUGS } from '@/lib/seo/slug';
import { MapCtaLink } from '@/components/MapCtaLink';

export default function CitiesIndex() {
  const cities = Object.entries(CITY_SLUGS);
  const categories = Object.entries(CATEGORY_SLUGS);

  return (
    <>
      <SEO
        title="Où sortir ce soir en France ? Villes & sorties | PulseMap"
        description="Où sortir ce soir en France ? Découvre les soirées, concerts, festivals et bars animés en direct dans toutes les grandes villes : Paris, Lyon, Marseille, Toulouse, Grenoble…"
        canonical="/villes"
        jsonLd={[
          organizationLd(),
          websiteLd(),
          breadcrumbLd([
            { name: 'Accueil', url: '/' },
            { name: 'Villes', url: '/villes' },
          ]),
        ]}
      />
      <main className="h-full overflow-y-auto bg-background text-foreground px-5 py-8 max-w-3xl mx-auto">
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <span className="px-3 py-1.5 font-medium text-foreground">Villes</span>
        </nav>
        <h1 className="text-3xl font-black mb-3">Où sortir ce soir en France ?</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          PulseMap référence en temps réel les soirées, concerts, festivals, bars animés et événements
          culturels qui se passent autour de vous, partout en France. Sélectionnez votre ville pour voir
          où sortir ce soir.
        </p>

        <MapCtaLink
          to="/"
          sourcePage="cities_index"
          className="inline-block mb-8 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
        >
          🗺️ Voir la carte
        </MapCtaLink>

        <section aria-labelledby="cities-h2" className="mb-10">
          <h2 id="cities-h2" className="text-xl font-bold mb-3">Sortir ce soir, par ville</h2>
          <ul className="grid grid-cols-2 gap-2">
            {cities.map(([slug, name]) => (
              <li key={slug}>
                <Link
                  to={`/sortir-ce-soir/${slug}`}
                  className="block px-4 py-3 rounded-xl border border-border bg-secondary hover:bg-accent/10 transition-colors"
                >
                  <span className="font-bold">Sortir ce soir à {name}</span>
                  <span className="block text-xs text-muted-foreground">Concerts, soirées & bars</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cats-h2">
          <h2 id="cats-h2" className="text-xl font-bold mb-3">Catégories</h2>
          <ul className="grid grid-cols-2 gap-2">
            {categories.map(([slug, c]) => (
              <li key={slug}>
                <Link
                  to={`/categories/${slug}`}
                  className="block px-4 py-3 rounded-xl border border-border bg-secondary hover:bg-accent/10 transition-colors"
                >
                  <span className="font-bold">{c.label}</span>
                  <span className="block text-xs text-muted-foreground line-clamp-1">{c.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
