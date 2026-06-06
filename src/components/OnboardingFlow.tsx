import { useState, useEffect } from 'react';
import { MapPin, Zap, Sliders, Users, Heart, X, ChevronRight, Music, PartyPopper, Theater, Activity, ShoppingBag, UsersRound } from 'lucide-react';

const STORAGE_KEY = 'pulse_onboarding_done_v1';

interface OnboardingFlowProps {
  onClose: () => void;
}

const slides = [
  {
    key: 'welcome',
    title: 'Bienvenue sur PulseMap',
    subtitle: 'Découvre en temps réel ce qui se passe autour de toi : concerts, soirées, festivals, brocantes, sport et plus encore.',
    visual: 'pulse',
  },
  {
    key: 'icons',
    title: 'Comprendre la carte',
    subtitle: 'Chaque pin sur la carte correspond à un type de sortie.',
    visual: 'icons',
  },
  {
    key: 'features',
    title: 'Tout ce que tu peux faire',
    subtitle: 'PulseMap est pensée pour sortir vite, mieux, et avec tes amis.',
    visual: 'features',
  },
] as const;

const iconRows = [
  { Icon: PartyPopper, color: 'text-pink-400', label: 'Soirées & clubs' },
  { Icon: Music, color: 'text-purple-400', label: 'Concerts live' },
  { Icon: Theater, color: 'text-amber-400', label: 'Culture & expos' },
  { Icon: Activity, color: 'text-emerald-400', label: 'Sport & running' },
  { Icon: ShoppingBag, color: 'text-orange-400', label: 'Brocantes & marchés' },
  { Icon: UsersRound, color: 'text-sky-400', label: 'Meetups & rencontres' },
  { Icon: Zap, color: 'text-red-500', label: 'LIVE — en ce moment' },
];

const featureRows = [
  { Icon: MapPin, label: 'Près de moi', desc: 'Toutes les sorties autour de ta position' },
  { Icon: Zap, label: 'LIVE', desc: 'Ce qui se passe maintenant, en temps réel' },
  { Icon: Sliders, label: 'Filtres', desc: 'Type, ambiance, distance, prix — à ta sauce' },
  { Icon: Users, label: 'Amis', desc: 'Vois où vont tes amis et sortez ensemble' },
  { Icon: Heart, label: 'Favoris', desc: 'Sauvegarde les events qui te branchent' },
];

export function OnboardingFlow({ onClose }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const total = slides.length;
  const current = slides[step];

  useEffect(() => {
    // Lock scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    onClose();
  };

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else finish();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full sm:max-w-md bg-card border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 pb-8 animate-scale-in max-h-[92vh] overflow-y-auto">
        {/* Skip */}
        <button
          onClick={finish}
          className="absolute top-4 right-4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-lg"
          aria-label="Passer"
        >
          Passer <X className="w-3.5 h-3.5" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-6 mt-2">
          {slides.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? 'bg-accent w-8' : i < step ? 'bg-accent/60 w-4' : 'bg-border w-4'
              }`}
            />
          ))}
        </div>

        {/* Visual */}
        <div className="mb-5">
          {current.visual === 'pulse' && (
            <div className="relative h-40 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-pink-500/10 to-purple-500/20">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent))_0%,transparent_50%),radial-gradient(circle_at_70%_60%,#ec4899_0%,transparent_50%)]" />
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" style={{ animationDelay: '0.4s' }} />
                <div className="relative w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/50">
                  <MapPin className="w-8 h-8 text-accent-foreground" fill="currentColor" />
                </div>
              </div>
            </div>
          )}

          {current.visual === 'icons' && (
            <div className="grid grid-cols-2 gap-2">
              {iconRows.map(({ Icon, color, label }) => (
                <div key={label} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border">
                  <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center ${color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>
          )}

          {current.visual === 'features' && (
            <div className="space-y-2">
              {featureRows.map(({ Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary border border-border">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text */}
        <h2 id="onboarding-title" className="text-2xl font-black text-foreground leading-tight mb-2">
          {current.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {current.subtitle}
        </p>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full py-3.5 rounded-2xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform shadow-lg shadow-accent/30"
        >
          {step === total - 1 ? 'Explorer la carte' : 'Continuer'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function useShouldShowOnboarding() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setShow(true);
    } catch {}
  }, []);
  return { show, close: () => setShow(false) };
}
