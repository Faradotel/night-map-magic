// Minimal, low-weight legal footer with real HTML anchor links
// so search engines and Google OAuth verification can crawl them.
export function LegalFooter() {
  const linkStyle: React.CSSProperties = {
    color: 'hsl(0 0% 100% / 0.7)',
    textDecoration: 'none',
    pointerEvents: 'auto',
    textShadow: '0 1px 4px hsl(0 0% 0% / 0.8)',
  };

  const dotStyle: React.CSSProperties = {
    color: 'hsl(0 0% 100% / 0.4)',
    textShadow: '0 1px 4px hsl(0 0% 0% / 0.8)',
  };

  return (
    <footer
      className="absolute left-0 right-0 z-[399] flex items-center justify-center gap-3 sm:gap-4 px-3 py-2 pointer-events-none select-none"
      style={{
        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        background:
          'linear-gradient(to top, hsl(0 0% 0% / 0.55), hsl(0 0% 0% / 0))',
      }}
      aria-label="Liens légaux"
    >
      <a
        href="/privacy-policy"
        className="text-[11px] font-medium tracking-wide hover:text-white transition-colors"
        style={linkStyle}
      >
        Confidentialité
      </a>
      <span className="text-[11px]" style={dotStyle} aria-hidden="true">·</span>
      <a
        href="/terms"
        className="text-[11px] font-medium tracking-wide hover:text-white transition-colors"
        style={linkStyle}
      >
        Conditions
      </a>
      <span className="text-[11px]" style={dotStyle} aria-hidden="true">·</span>
      <a
        href="/contact-legal"
        className="text-[11px] font-medium tracking-wide hover:text-white transition-colors"
        style={linkStyle}
      >
        Contact
      </a>
    </footer>
  );
}
