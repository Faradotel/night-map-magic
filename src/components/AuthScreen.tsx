import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function AuthScreen({ inline = false }: { inline?: boolean }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-xl border text-xs font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          style={{ borderColor: 'hsl(var(--border))' }} required minLength={6} />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </>
  );

  if (inline) {
    return (
      <div>
        <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
          {formFields}
          {error && <p className="text-xs font-medium text-center" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-10 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50" style={{ background: 'hsl(var(--accent))', color: 'white' }}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
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
            {mode === 'login' ? 'Content de te revoir !' : 'Rejoins la communauté'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
          {mode === 'signup' && (
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pseudo"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ borderColor: 'hsl(var(--border))' }}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
              style={{ borderColor: 'hsl(var(--border))' }}
              required
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-10 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
              style={{ borderColor: 'hsl(var(--border))' }}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-xs font-medium text-center" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'hsl(var(--accent))',
              color: 'white',
              boxShadow: '0 0 20px hsl(var(--accent) / 0.4)',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
          className="mt-4 text-xs text-muted-foreground"
        >
          {mode === 'login' ? (
            <>Pas de compte ? <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Inscription</span></>
          ) : (
            <>Déjà un compte ? <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Connexion</span></>
          )}
        </button>
      </div>
    </div>
  );
}
