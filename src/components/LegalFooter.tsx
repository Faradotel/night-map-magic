// Minimal legal links bar above the BottomNav.
// Real <a href> tags so Google OAuth verification & SEO crawlers can detect them.
export function LegalFooter() {
  return (
    <footer
      className="fixed left-0 right-0 flex items-center justify-center pointer-events-none select-none"
      style={{
        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 6px)',
        zIndex: 401,
      }}
      aria-label="Liens légaux"
    >
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1"
        style={{
          background: 'hsl(0 0% 0% / 0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid hsl(0 0% 100% / 0.08)',
        }}
      >
        <LegalLink href="/privacy-policy">RGPD</LegalLink>
        <Dot />
        <LegalLink href="/terms">Conditions</LegalLink>
        <Dot />
        <LegalLink href="/contact-legal">Contact</LegalLink>
      </div>
    </footer>
  );
}

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-[11px] font-semibold tracking-wide transition-opacity hover:opacity-100"
      style={{ color: 'hsl(0 0% 100% / 0.85)', textDecoration: 'none' }}
    >
      {children}
    </a>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="text-[11px]"
      style={{ color: 'hsl(0 0% 100% / 0.35)' }}
    >
      ·
    </span>
  );
}
