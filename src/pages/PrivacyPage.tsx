import { ArrowLeft, Shield, Database, Eye, Trash2, Mail, MapPin, Users, Cookie, Server, FileText } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PulseMap',
  url: 'https://pulse-map.live/',
  logo: 'https://pulse-map.live/icon-512.png',
  email: 'privacy@pulsemap.app',
  sameAs: ['https://pulse-map.live/'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy — PulseMap',
  description: 'Privacy policy and personal data protection statement for PulseMap.',
  url: 'https://pulse-map.live/privacy-policy',
  dateModified: '2026-05-16',
  inLanguage: 'en',
  isPartOf: {
    '@type': 'WebSite',
    name: 'PulseMap',
    url: 'https://pulse-map.live/',
  },
  about: orgJsonLd,
};

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Politique de confidentialité (RGPD) | PulseMap"
        description="Découvre comment PulseMap protège tes données personnelles conformément au RGPD. Droits d'accès, suppression, hébergement UE."
        canonical="/rgpd"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
        {/* Subtle ambient glow */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />

        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b px-4 py-3" style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border))' }}>
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <ArrowLeft size={16} />
              Retour à la carte
            </Link>
            <span className="ml-auto text-xs font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
              PulseMap
            </span>
          </div>
        </nav>

        {/* Hero */}
        <header className="relative px-4 pt-12 pb-8">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'hsl(var(--accent) / 0.12)' }}
            >
              <Shield size={28} style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Politique de confidentialit<span style={{ color: 'hsl(var(--accent))' }}>é</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
              PulseMap s'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679) et à la loi Informatique et Libertés.
            </p>
            <p className="mt-2 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Dernière mise à jour : mai 2026
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 pb-20">
          <div className="mx-auto max-w-3xl space-y-4">
            <Section icon={<Database size={18} />} iconColor="hsl(var(--primary))" iconBg="hsl(var(--primary) / 0.12)" title="1. Données collectées">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Nous collectons uniquement les données nécessaires au fonctionnement de l'application :
              </p>
              <ul className="mt-3 space-y-2">
                <DataItem label="Email & mot de passe" desc="Pour la création et la sécurisation de ton compte." />
                <DataItem label="Pseudo" desc="Affiché publiquement pour identifier ton profil auprès de tes amis." />
                <DataItem label="Ville préférée" desc="Pour afficher les événements pertinents dans ta zone." />
                <DataItem label="Historique de présence" desc="Les événements auxquels tu as indiqué participer (check-ins)." />
                <DataItem label="Liste d'amis" desc="Les connexions avec d'autres utilisateurs que tu as acceptées." />
              </ul>
            </Section>

            <Section icon={<MapPin size={18} />} iconColor="hsl(var(--neon-pink))" iconBg="hsl(var(--neon-pink) / 0.12)" title="2. Géolocalisation">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                PulseMap peut utiliser ta position géographique pour afficher les événements proches de toi. Cette donnée est traitée <strong className="text-foreground">localement dans ton navigateur</strong> et n'est jamais transmise ni stockée sur nos serveurs. Tu peux refuser la géolocalisation à tout moment via les paramètres de ton navigateur, et utiliser le mode « Ville » à la place.
              </p>
            </Section>

            <Section icon={<Eye size={18} />} iconColor="hsl(var(--neon-purple))" iconBg="hsl(var(--neon-purple) / 0.12)" title="3. Finalités du traitement">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Tes données sont utilisées exclusivement pour :
              </p>
              <ul className="mt-3 space-y-1.5">
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• Créer et gérer ton compte utilisateur</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• Afficher les événements pertinents selon ta localisation ou ta ville</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• Permettre le suivi de tes participations (check-ins) et badges</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• Gérer ta liste d'amis et les notifications associées</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• Améliorer l'expérience utilisateur de l'application</li>
              </ul>
              <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Aucune donnée n'est vendue, louée ou transmise à des tiers à des fins commerciales.
              </p>
            </Section>

            <Section icon={<Users size={18} />} iconColor="hsl(45 100% 55%)" iconBg="hsl(45 100% 55% / 0.12)" title="4. Partage des données">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Tes données sont visibles de manière limitée :
              </p>
              <ul className="mt-3 space-y-1.5">
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Pseudo :</strong> visible par tous les utilisateurs (pour la recherche d'amis)</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Check-ins :</strong> visibles uniquement par toi et tes amis confirmés</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Email :</strong> jamais affiché publiquement</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Les données d'événements proviennent de sources tierces (Shotgun, Ticketmaster) et sont affichées en l'état.
              </p>
            </Section>

            <Section icon={<Server size={18} />} iconColor="hsl(var(--neon-green))" iconBg="hsl(var(--neon-green) / 0.12)" title="5. Conservation des données">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Tes données sont conservées tant que ton compte est actif. En cas de suppression de compte, toutes tes données personnelles (profil, check-ins, amitiés, notifications) sont supprimées définitivement dans un délai de 30 jours.
              </p>
            </Section>

            <Section icon={<Shield size={18} />} iconColor="hsl(210 100% 56%)" iconBg="hsl(210 100% 56% / 0.12)" title="6. Hébergement & sécurité">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Les données sont hébergées sur des serveurs sécurisés au sein de l'Union Européenne. Les communications sont chiffrées via HTTPS/TLS. Les mots de passe sont hashés et ne sont jamais stockés en clair. L'accès aux données est protégé par des politiques de sécurité au niveau de la base de données (Row Level Security).
              </p>
            </Section>

            <Section icon={<Trash2 size={18} />} iconColor="hsl(var(--destructive))" iconBg="hsl(var(--destructive) / 0.12)" title="7. Tes droits (RGPD)">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Conformément au RGPD, tu disposes des droits suivants :
              </p>
              <ul className="mt-3 space-y-1.5">
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Droit d'accès :</strong> consulter tes données personnelles</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Droit de rectification :</strong> modifier tes informations (pseudo, ville…)</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Droit à l'effacement :</strong> supprimer ton compte et toutes tes données</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Droit à la portabilité :</strong> exporter tes données dans un format lisible</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Droit d'opposition :</strong> t'opposer à certains traitements</li>
                <li className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>• <strong className="text-foreground">Droit de retrait :</strong> retirer ton consentement à tout moment</li>
              </ul>
            </Section>

            <Section icon={<Cookie size={18} />} iconColor="hsl(25 90% 55%)" iconBg="hsl(25 90% 55% / 0.12)" title="8. Cookies & stockage local">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                PulseMap utilise le stockage local du navigateur (localStorage) pour sauvegarder tes préférences (thème, unité de distance, ville préférée) et ta session d'authentification. Aucun cookie tiers de tracking ou publicitaire n'est utilisé.
              </p>
            </Section>

            <Section icon={<Mail size={18} />} iconColor="hsl(var(--accent))" iconBg="hsl(var(--accent) / 0.12)" title="9. Contact">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Pour exercer tes droits ou pour toute question relative à la protection de tes données, tu peux nous contacter à :
              </p>
              <p className="mt-2 text-sm font-bold" style={{ color: 'hsl(var(--accent))' }}>
                privacy@pulsemap.app
              </p>
              <p className="mt-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Tu peux également adresser une réclamation à la CNIL (Commission Nationale de l'Informatique et des Libertés) : <span className="font-medium text-foreground">www.cnil.fr</span>
              </p>
            </Section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t px-4 py-8" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="mx-auto max-w-3xl flex flex-col items-center gap-3 text-center">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              © 2026 PulseMap. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-xs font-medium transition-colors hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Accueil
              </Link>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <Link to="/villes" className="text-xs font-medium transition-colors hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Villes
              </Link>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                Confidentialité
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function Section({
  icon,
  iconColor,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-5 transition-shadow hover:shadow-lg"
      style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DataItem({ label, desc }: { label: string; desc: string }) {
  return (
    <li className="flex gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
      <span>
        <strong className="text-foreground">{label}</strong> — {desc}
      </span>
    </li>
  );
}
