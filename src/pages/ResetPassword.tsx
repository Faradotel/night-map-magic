import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-black text-foreground mb-2">Lien invalide</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ce lien de réinitialisation est invalide ou a expiré. Demande un nouveau lien depuis l'écran de connexion.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-bold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(130 60% 55% / 0.15)' }}>
            <Check size={32} style={{ color: 'hsl(130 60% 55%)' }} />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">Mot de passe mis à jour !</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ton mot de passe a été changé avec succès. Tu peux maintenant te connecter.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: 'hsl(var(--accent))', color: 'white', boxShadow: '0 0 20px hsl(var(--accent) / 0.4)' }}
          >
            Retour à PulseMap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <SEO
        title="Réinitialiser le mot de passe | PulseMap"
        description="Choisissez un nouveau mot de passe pour votre compte PulseMap."
        canonical="/reset-password"
        noindex
      />
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">
            PulseMap — Réinitialisation du mot de passe
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Choisis ton nouveau mot de passe</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-10 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ borderColor: 'hsl(var(--border))' }}
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ borderColor: 'hsl(var(--border))' }}
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-xs font-medium text-center" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'hsl(var(--accent))', color: 'white', boxShadow: '0 0 20px hsl(var(--accent) / 0.4)' }}
          >
            {loading ? '...' : 'Changer le mot de passe'}
          </button>
        </form>

        <button onClick={() => navigate('/')} className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
          <ArrowLeft size={12} /> Retour
        </button>
      </div>
    </div>
  );
}
