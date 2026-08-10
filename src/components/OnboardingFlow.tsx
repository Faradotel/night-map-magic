import { useState, useEffect, useMemo } from 'react';
import { MapPin, X, ChevronRight, ChevronLeft, Navigation, Search, Check } from 'lucide-react';
import { City, CITIES, findNearestCity } from '@/components/LocationMode';
import { InterestTag, INTEREST_TAG_OPTIONS } from '@/hooks/useOnboardingPreferences';

interface OnboardingFlowProps {
  /** city=null means "no city chosen" (skip, or edit-mode clear) */
  onComplete: (city: City | null, tags: InterestTag[]) => void;
  initialCity?: City | null;
  initialTags?: InterestTag[];
  /** 'edit' hides the skip button and relabels the final CTA for re-entry from the profile screen */
  mode?: 'onboarding' | 'edit';
}

export function OnboardingFlow({ onComplete, initialCity = null, initialTags = [], mode = 'onboarding' }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);
  const [selectedTags, setSelectedTags] = useState<InterestTag[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const filteredCities = useMemo(
    () => CITIES.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery],
  );

  const finish = (city: City | null, tags: InterestTag[]) => onComplete(city, tags);
  const skip = () => finish(null, []);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
        if (nearest) setSelectedCity(nearest);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const toggleTag = (tag: InterestTag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full sm:max-w-md bg-card border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 pb-8 animate-scale-in max-h-[92vh] overflow-y-auto">
        {mode === 'onboarding' && (
          <button
            onClick={skip}
            className="absolute top-4 right-4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-lg"
            aria-label="Passer"
          >
            Passer <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-6 mt-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? 'bg-accent w-8' : i < step ? 'bg-accent/60 w-4' : 'bg-border w-4'
              }`}
            />
          ))}
        </div>

        {step === 0 ? (
          <>
            <h2 id="onboarding-title" className="text-2xl font-black text-foreground leading-tight mb-2">
              Tu es dans quelle ville ?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              On te montre ce qui se passe près de chez toi.
            </p>

            <button
              onClick={useMyLocation}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary border border-border font-semibold text-sm mb-4 active:scale-[0.98] transition-transform"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Localisation…' : 'Utiliser ma position'}
            </button>

            <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary border border-border mb-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une ville…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
              />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border mb-6">
              {filteredCities.length === 0 ? (
                <p className="px-3 py-4 text-xs text-center text-muted-foreground">Aucune ville trouvée</p>
              ) : (
                filteredCities.map((city) => {
                  const active = selectedCity?.name === city.name;
                  return (
                    <button
                      key={city.name}
                      onClick={() => setSelectedCity(city)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm"
                      style={{ background: active ? 'hsl(var(--accent) / 0.12)' : 'transparent' }}
                    >
                      <MapPin className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      <span className="font-medium text-foreground">{city.name}</span>
                      {active && <Check className="w-3.5 h-3.5 ml-auto text-accent shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!selectedCity}
              className="w-full py-3.5 rounded-2xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform shadow-lg shadow-accent/30 disabled:opacity-40 disabled:pointer-events-none"
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <h2 id="onboarding-title" className="text-2xl font-black text-foreground leading-tight mb-2">
              Qu'est-ce qui te branche ?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              On pré-filtre la carte selon tes goûts — tu pourras toujours tout changer plus tard.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {INTEREST_TAG_OPTIONS.map(({ key, label, emoji }) => {
                const active = selectedTags.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleTag(key)}
                    className="flex items-center gap-2 p-3 rounded-xl border text-left active:scale-[0.98] transition-transform"
                    style={{
                      background: active ? 'hsl(var(--accent) / 0.12)' : 'hsl(var(--secondary))',
                      borderColor: active ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                    }}
                  >
                    <span className="text-lg leading-none">{emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {active && <Check className="w-3.5 h-3.5 ml-auto text-accent shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="py-3.5 px-4 rounded-2xl bg-secondary border border-border font-bold text-sm flex items-center justify-center active:scale-[0.98] transition-transform"
                aria-label="Retour"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => finish(selectedCity, selectedTags)}
                className="flex-1 py-3.5 rounded-2xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform shadow-lg shadow-accent/30"
              >
                {mode === 'edit' ? 'Enregistrer' : "C'est parti"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
