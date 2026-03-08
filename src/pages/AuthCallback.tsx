import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// This page runs in the web app (pulse-map.live) inside Chrome Custom Tab.
// It fires the deep link without navigating away, so no error page is shown.
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    // Use a link click instead of window.location.href so Chrome stays on this page
    // Android intercepts the custom scheme and opens the native app
    const link = document.createElement('a');
    link.href = `com.nightmap.app://auth?code=${code}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDone(true);
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
      {done ? (
        <>
          <p style={{ fontSize: '2rem' }}>✅</p>
          <p>Connecté ! Retourne dans l'application.</p>
        </>
      ) : (
        <p>Connexion en cours...</p>
      )}
    </div>
  );
}
