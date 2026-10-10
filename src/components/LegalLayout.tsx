import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, useSwipeBack } from '@/components/BackButton';
import { LEGAL_INFO_COMPLETE } from '@/lib/legal';

/** Mise en page commune des pages legales (confidentialite, conditions, sources...). */
export function LegalLayout({
  icon, title, intro, updated, children, backLabel = 'Retour à la carte',
}: { icon: ReactNode; title: string; intro?: ReactNode; updated?: string; children: ReactNode; backLabel?: string }) {
  useSwipeBack();
  return (
    <div className="h-full overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      <nav className="sticky top-0 z-50 border-b px-4 py-3" style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border))' }}>
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <BackButton label={backLabel} />
          <span className="ml-auto text-xs font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>PulseMap</span>
        </div>
      </nav>
      <header className="relative px-4 pt-12 pb-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))' }}>
            {icon}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{intro}</p>}
          {updated && <p className="mt-2 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{updated}</p>}
        </div>
      </header>
      <main className="px-4 pb-20">
        <div className="mx-auto max-w-3xl space-y-4 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {children}
        </div>
      </main>
      <footer className="border-t px-4 py-8" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <Link to="/privacy-policy" className="hover:text-foreground">Confidentialité</Link>
          <Link to="/terms" className="hover:text-foreground">Conditions</Link>
          <Link to="/sources" className="hover:text-foreground">Sources</Link>
          <Link to="/contact-legal" className="hover:text-foreground">Contact</Link>
          {LEGAL_INFO_COMPLETE && <Link to="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>}
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ id, icon, title, children }: { id?: string; icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border p-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="mb-3 flex items-center gap-3">
        {icon && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--accent))' }}>{icon}</div>}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function Bullet({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'hsl(var(--accent))' }} />
      <span>{label && <strong className="text-foreground">{label} : </strong>}{children}</span>
    </li>
  );
}

/** Adresse de contact, ou lien vers /contact-legal si elle n'est pas encore renseignee. */
export function ContactEmail({ email }: { email: string | null }) {
  if (email) return <a href={`mailto:${email}`} className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>{email}</a>;
  return <Link to="/contact-legal" className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>la page Contact</Link>;
}
