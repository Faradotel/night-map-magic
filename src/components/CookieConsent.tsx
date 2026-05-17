import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'pulse_cookie_consent';

export type CookieChoice = 'accepted' | 'rejected';

export function getCookieConsent(): CookieChoice | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'accepted' || v === 'rejected' ? v : null;
}

export function setCookieConsent(choice: CookieChoice) {
  localStorage.setItem(STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent('pulse:cookie-consent', { detail: choice }));
}

export function openCookieBanner() {
  window.dispatchEvent(new CustomEvent('pulse:cookie-open'));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const onOpen = () => setVisible(true);
    window.addEventListener('pulse:cookie-open', onOpen);
    return () => window.removeEventListener('pulse:cookie-open', onOpen);
  }, []);

  if (!visible) return null;

  const handle = (choice: CookieChoice) => {
    setCookieConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed left-1/2 -translate-x-1/2 z-[9000] w-[calc(100%-1.5rem)] max-w-md rounded-2xl border p-4 shadow-2xl"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
        background: 'hsl(var(--card) / 0.96)',
        borderColor: 'hsl(var(--border))',
        backdropFilter: 'blur(16px)',
      }}
    >
      <button
        onClick={() => handle('rejected')}
        aria-label="Refuser et fermer"
        className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'hsl(var(--accent) / 0.14)', color: 'hsl(var(--accent))' }}
        >
          <Cookie size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Cookies & stockage local</h3>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            PulseMap utilise uniquement le stockage local nécessaire au fonctionnement
            (session, préférences). Aucun cookie publicitaire ou de tracking tiers.{' '}
            <Link to="/privacy-policy" className="underline font-medium" style={{ color: 'hsl(var(--accent))' }}>
              En savoir plus
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handle('rejected')}
          className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          Refuser
        </button>
        <button
          onClick={() => handle('accepted')}
          className="flex-1 rounded-xl px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(var(--accent))' }}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
