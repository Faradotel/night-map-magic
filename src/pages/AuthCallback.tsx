import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';

// This page runs inside Chrome Custom Tab after Google OAuth.
// It uses the Android Intent URL scheme — Chrome recognises it natively
// and opens the native app WITHOUT showing an error page.
export default function AuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    // intent:// is handled natively by Chrome — no ERR_UNKNOWN_URL_SCHEME
    const fallback = encodeURIComponent('https://pulse-map.live');
    const intentUrl =
      `intent://auth?code=${code}` +
      `#Intent;scheme=com.nightmap.app;package=com.nightmap.app;` +
      `S.browser_fallback_url=${fallback};end`;

    window.location.href = intentUrl;
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0f0a1a',
      color: 'white',
      fontFamily: 'sans-serif',
      gap: '12px',
    }}>
      <p>Connexion en cours...</p>
      <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Retourne dans l'application PulseMap</p>
    </div>
  );
}
