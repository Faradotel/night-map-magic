import { Link } from 'react-router-dom';
import { SEO, SITE } from '@/components/SEO';
import { breadcrumbLd, organizationLd, websiteLd } from '@/lib/seo/jsonld';
import { CITY_SLUGS, CATEGORY_SLUGS } from '@/lib/seo/slug';

export default function CitiesIndex() {
  const cities = Object.entries(CITY_SLUGS);
  const categories = Object.entries(CATEGORY_SLUGS);

  return (
    <>
      <SEO
        title="Villes & Sorties en France | PulseMap"
        description="Découvrez les événements, concerts, soirées et festivals en direct dans toutes les grandes villes de France avec PulseMap."
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
        <h1 className="text-3xl font-black mb-3">Sorties & Événements en France</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          PulseMap référence en temps réel les soirées, concerts, festivals, bars animés et événements
          culturels qui se passent autour de vous. Sélectionnez une ville pour voir ce qui se passe ce soir.
        </p>

        <section aria-labelledby="cities-h2" className="mb-10">
          <h2 id="cities-h2" className="text-xl font-bold mb-3">Villes</h2>
          <ul className="grid grid-cols-2 gap-2">
            {cities.map(([slug, name]) => (
              <li key={slug}>
                <Link
                  to={`/villes/${slug}`}
                  className="block px-4 py-3 rounded-xl border border-border bg-secondary hover:bg-accent/10 transition-colors"
                >
                  <span className="font-bold">{name}</span>
                  <span className="block text-xs text-muted-foreground">Sorties & événements</span>
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

        <p className="text-xs text-muted-foreground mt-10">
          <Link to="/" className="underline hover:text-foreground">Retour à la carte</Link>
        </p>
      </main>
    </>
  );
}
