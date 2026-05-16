// Minimal, low-weight legal footer with real HTML anchor links
// so search engines and Google OAuth verification can crawl them.
export function LegalFooter() {
  const linkStyle: React.CSSProperties = {
    color: 'hsl(var(--muted-foreground))',
    textDecoration: 'none',
    pointerEvents: 'auto',
  };

  return (
    <div
      className="absolute left-0 right-0 z-[399] flex items-center justify-center gap-3 px-3 py-1 pointer-events-none select-none"
      style={{
        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        background:
          'linear-gradient(to top, hsl(var(--background) / 0.55), hsl(var(--background) / 0))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      aria-label="Legal links"
    >
      <a
        href="/privacy-policy"
        className="text-[10px] font-medium tracking-wide hover:text-foreground transition-colors"
        style={linkStyle}
      >
        Privacy Policy
      </a>
      <span
        className="text-[10px] opacity-40"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        ·
      </span>
      <a
        href="/terms"
        className="text-[10px] font-medium tracking-wide hover:text-foreground transition-colors"
        style={linkStyle}
      >
        Terms
      </a>
      <span
        className="text-[10px] opacity-40"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        ·
      </span>
      <a
        href="mailto:privacy@pulsemap.app"
        className="text-[10px] font-medium tracking-wide hover:text-foreground transition-colors"
        style={linkStyle}
      >
        Contact
      </a>
    </div>
  );
}
