import { ArrowLeft, Mail, Shield, User, MapPin, Building } from 'lucide-react';
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
  '@type': 'ContactPage',
  name: 'Contact légal — PulseMap',
  description: 'Informations légales, DPO et responsable RGPD de PulseMap.',
  url: 'https://pulse-map.live/contact-legal',
  dateModified: '2026-05-17',
  inLanguage: 'fr',
  isPartOf: {
    '@type': 'WebSite',
    name: 'PulseMap',
    url: 'https://pulse-map.live/',
  },
  about: orgJsonLd,
  mainEntity: {
    '@type': 'Organization',
    name: 'PulseMap',
    url: 'https://pulse-map.live/',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'DPO / Responsable RGPD',
      email: 'privacy@pulsemap.app',
      availableLanguage: ['French', 'English'],
    },
  },
};

export default function ContactLegalPage() {
  return (
    <>
      <SEO
        title="Contact légal | PulseMap"
        description="Contact légal de PulseMap : DPO, responsable RGPD, informations de l'éditeur et moyens de contact pour exercer tes droits."
        canonical="/contact-legal"
        jsonLd={[orgJsonLd, jsonLd]}
        hreflang={[
          { lang: 'fr', path: '/contact-legal' },
          { lang: 'x-default', path: '/contact-legal' },
        ]}
      />

      <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
        {/* Ambient glow */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />

        <nav
          className="sticky top-0 z-50 border-b px-4 py-3"
          style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border))' }}
        >
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <ArrowLeft size={16} />
              Retour à la carte
            </Link>
            <span
              className="ml-auto text-xs font-bold tracking-widest uppercase"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              PulseMap
            </span>
          </div>
        </nav>

        <header className="relative px-4 pt-12 pb-8">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'hsl(var(--accent) / 0.12)' }}
            >
              <Shield size={28} style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Contact légal
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Informations de l'éditeur, DPO / responsable RGPD et moyens de contact pour exercer tes droits.
            </p>
          </div>
        </header>

        <main className="px-4 pb-20">
          <div className="mx-auto max-w-3xl space-y-4">
            <Card icon={<Building size={18} />} iconColor="hsl(var(--primary))" iconBg="hsl(var(--primary) / 0.12)" title="Éditeur de l'application">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <strong className="text-foreground">PulseMap</strong> est une application de cartographie d'événements en temps réel éditée par l'équipe PulseMap.
              </p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'hsl(var(--primary))' }} /><span><strong className="text-foreground">Siège social :</strong> France</span></li>
                <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'hsl(var(--primary))' }} /><span><strong className="text-foreground">Email officiel :</strong> privacy@pulsemap.app</span></li>
              </ul>
            </Card>

            <Card icon={<User size={18} />} iconColor="hsl(var(--accent))" iconBg="hsl(var(--accent) / 0.12)" title="DPO / Responsable RGPD">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Conformément au Règlement Général sur la Protection des Données (RGPD), le responsable du traitement des données à caractère personnel assure également les fonctions de DPO (Data Protection Officer) au sein de la structure.
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Pour toute question relative à la protection de tes données personnelles ou pour exercer tes droits (accès, rectification, effacement, portabilité, opposition), contacte :
              </p>
              <div
                className="mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Mail size={16} style={{ color: 'hsl(var(--accent))' }} />
                privacy@pulsemap.app
              </div>
              <p className="mt-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Délai de réponse : <strong className="text-foreground">30 jours maximum</strong> à compter de la réception de la demande.
              </p>
            </Card>

            <Card icon={<MapPin size={18} />} iconColor="hsl(45 100% 55%)" iconBg="hsl(45 100% 55% / 0.12)" title="Réclamation auprès de la CNIL">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à l'autorité de contrôle française :
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Commission Nationale de l'Informatique et des Libertés (CNIL)
              </p>
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-medium underline"
                style={{ color: 'hsl(var(--accent))' }}
              >
                www.cnil.fr
              </a>
            </Card>

            <Card icon={<Shield size={18} />} iconColor="hsl(210 100% 56%)" iconBg="hsl(210 100% 56% / 0.12)" title="Hébergement & sécurité">
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Les données sont hébergées sur des serveurs sécurisés situés au sein de l'Union Européenne. Les communications sont chiffrées via HTTPS/TLS. Les mots de passe sont hashés. L'accès aux données est protégé par des politiques Row Level Security (RLS).
              </p>
            </Card>
          </div>
        </main>

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
              <Link to="/privacy-policy" className="text-xs font-medium transition-colors hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Confidentialité
              </Link>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <Link to="/terms" className="text-xs font-medium transition-colors hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Conditions
              </Link>
              <span style={{ color: 'hsl(var(--border))' }}>|</span>
              <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                Contact légal
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function Card({ icon, iconColor, iconBg, title, children }: { icon: React.ReactNode; iconColor: string; iconBg: string; title: string; children: React.ReactNode }) {
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
