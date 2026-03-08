import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// This page runs in the web app (Lovable deployed URL).
// When opened in Chrome Custom Tab after OAuth, it redirects back to the native app.
export default function AuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // Redirect to native app custom scheme — Android intercepts this and fires appUrlOpen
      window.location.href = `com.nightmap.app://auth?code=${code}`;
    } else {
      // Fallback: try to get session from hash (implicit flow)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.location.href = 'com.nightmap.app://auth?session=ok';
        }
      });
    }
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0f0a1a',
      color: 'white',
      fontFamily: 'sans-serif',
    }}>
      <p>Connexion en cours...</p>
    </div>
  );
}
