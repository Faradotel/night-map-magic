import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function AuthScreen({ inline = false }: { inline?: boolean }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setResetSent(true);
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (username.length < 3) {
        setError('Le pseudo doit faire au moins 3 caractères');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (error) setError(error);
      else setConfirmSent(true);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  };

  if (resetSent) {
    return (
      <div className={inline ? "text-center" : "absolute inset-0 z-[700] flex flex-col items-center justify-center px-6"} style={inline ? {} : { background: 'hsl(var(--background))' }}>
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-xl font-black text-foreground mb-2">Email envoyé !</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Un lien de réinitialisation a été envoyé à <strong className="text-foreground">{email}</strong>. Vérifie ta boîte mail (et tes spams).
          </p>
          <button
            onClick={() => { setResetSent(false); setMode('login'); }}
            className="text-sm font-bold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (confirmSent) {
    return (
      <div className={inline ? "text-center" : "absolute inset-0 z-[700] flex flex-col items-center justify-center px-6"} style={inline ? {} : { background: 'hsl(var(--background))' }}>
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-black text-foreground mb-2">Confirme ton email</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Un email de confirmation a été envoyé à <strong className="text-foreground">{email}</strong>. Clique sur le lien pour activer ton compte.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setMode('login'); }}
            className="text-sm font-bold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const formFields = (
    <>
      {mode === 'signup' && (
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Pseudo" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border text-xs font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderColor: 'hsl(var(--border))' }} required />
        </div>
      )}
      <div className="relative">
        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl border text-xs font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          style={{ borderColor: 'hsl(var(--border))' }} required />
      </div>
      {mode !== 'forgot' && (
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-xl border text-xs font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderColor: 'hsl(var(--border))' }} required minLength={6} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )}
      {mode === 'login' && (
        <button type="button" onClick={() => { setMode('forgot'); setError(null); }} className="text-[10px] text-muted-foreground text-right w-full -mt-1">
          Mot de passe oublié ?
        </button>
      )}
    </>
  );


  if (inline) {
    return (
      <div>
        <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
          {formFields}
          {error && <p className="text-xs font-medium text-center" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-10 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50" style={{ background: 'hsl(var(--accent))', color: 'white' }}>
            {loading ? '...' : mode === 'forgot' ? 'Envoyer le lien' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <div className="flex gap-2 mt-2.5">
          <button onClick={() => handleOAuth('google')} className="flex-1 h-10 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95" style={{ borderColor: 'hsl(var(--border))' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button onClick={() => handleOAuth('apple')} className="flex-1 h-10 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95" style={{ borderColor: 'hsl(var(--border))' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </button>
        </div>
        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="mt-3 text-xs text-muted-foreground">
          {mode === 'login' ? <>Pas de compte ? <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Inscription</span></> : <>Déjà un compte ? <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Connexion</span></>}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[700] flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Background glow */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">
            Night<span style={{ color: 'hsl(var(--primary))' }}>Map</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'forgot' ? 'Réinitialise ton mot de passe' : mode === 'login' ? 'Content de te revoir !' : 'Rejoins la communauté'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
          {mode === 'signup' && (
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Pseudo" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ borderColor: 'hsl(var(--border))' }} required />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
              style={{ borderColor: 'hsl(var(--border))' }} required />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-10 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
                style={{ borderColor: 'hsl(var(--border))' }} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => { setMode('forgot'); setError(null); }} className="text-xs text-muted-foreground text-right w-full -mt-1">
              Mot de passe oublié ?
            </button>
          )}

          {error && (
            <p className="text-xs font-medium text-center" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'hsl(var(--accent))', color: 'white', boxShadow: '0 0 20px hsl(var(--accent) / 0.4)' }}
          >
            {loading ? '...' : mode === 'forgot' ? 'Envoyer le lien' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        {/* OAuth buttons */}
        <div className="w-full max-w-xs mx-auto mt-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOAuth('google')}
              className="flex-1 h-12 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth('apple')}
              className="flex-1 h-12 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Apple
            </button>
          </div>
        </div>

        <button
          onClick={() => { setMode(mode === 'forgot' ? 'login' : mode === 'login' ? 'signup' : 'login'); setError(null); }}
          className="mt-4 text-xs text-muted-foreground"
        >
          {mode === 'forgot' ? (
            <><ArrowLeft size={12} className="inline mr-1" />Retour à la <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>connexion</span></>
          ) : mode === 'login' ? (
            <>Pas de compte ? <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Inscription</span></>
          ) : (
            <>Déjà un compte ? <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Connexion</span></>
          )}
        </button>
      </div>
    </div>
  );
}
