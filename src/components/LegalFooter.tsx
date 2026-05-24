// Minimal, low-weight legal footer with real HTML anchor links
// so search engines and Google OAuth verification can crawl them.
// Mobile: subtle row above the bottom nav. Desktop: same component, breathable.
export function LegalFooter() {
  const linkStyle: React.CSSProperties = {
    color: 'hsl(var(--muted-foreground))',
    textDecoration: 'none',
    pointerEvents: 'auto',
    opacity: 0.6,
  };

  const dotStyle: React.CSSProperties = {
    color: 'hsl(var(--muted-foreground))',
    opacity: 0.3,
  };

  return (
    <footer
      className="absolute left-0 right-0 z-[399] flex items-center justify-center gap-2.5 sm:gap-4 px-3 py-1.5 pointer-events-none select-none"
      style={{
        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        background:
          'linear-gradient(to top, hsl(var(--background) / 0.45), hsl(var(--background) / 0))',
      }}
      aria-label="Liens légaux"
    >
      <a
        href="/privacy-policy"
        className="text-[10px] sm:text-[11px] font-medium tracking-wide hover:opacity-100 transition-opacity"
        style={linkStyle}
      >
        Confidentialité
      </a>
      <span className="text-[10px] sm:text-[11px]" style={dotStyle} aria-hidden="true">·</span>
      <a
        href="/terms"
        className="text-[10px] sm:text-[11px] font-medium tracking-wide hover:opacity-100 transition-opacity"
        style={linkStyle}
      >
        Conditions
      </a>
      <span className="text-[10px] sm:text-[11px]" style={dotStyle} aria-hidden="true">·</span>
      <a
        href="/contact-legal"
        className="text-[10px] sm:text-[11px] font-medium tracking-wide hover:opacity-100 transition-opacity"
        style={linkStyle}
      >
        Contact
      </a>
    </footer>
  );
}
