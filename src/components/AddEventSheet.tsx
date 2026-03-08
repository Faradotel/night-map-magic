import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Loader2, Plus, Eye } from 'lucide-react';
import { NightEvent, PriceRange } from '@/data/mockEvents';
import { EventFormData, imageColors } from './add-event/types';
import { StepBasicInfo } from './add-event/StepBasicInfo';
import { StepLocation } from './add-event/StepLocation';
import { StepDetails } from './add-event/StepDetails';
import { StepPreview } from './add-event/StepPreview';

interface AddEventSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: NightEvent) => void;
}

const STEPS = [
  { title: 'Infos générales', subtitle: 'Nom, date et style' },
  { title: 'Localisation', subtitle: 'Adresse et lieu' },
  { title: 'Détails & prix', subtitle: 'Description et tarif' },
  { title: 'Aperçu', subtitle: 'Vérifier avant publication' },
];

function derivePriceRange(priceStr: string): PriceRange {
  const cleaned = priceStr.toLowerCase().replace(/\s/g, '');
  if (cleaned.includes('gratuit') || cleaned === '0' || cleaned === '0€') return 'gratuit';
  const nums = cleaned.match(/\d+/g);
  if (!nums) return '€10-20';
  const max = Math.max(...nums.map(Number));
  if (max <= 10) return '€1-10';
  if (max <= 20) return '€10-20';
  return '€20+';
}

export function AddEventSheet({ open, onClose, onAdd }: AddEventSheetProps) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: '',
    time: '22:00',
    type: 'soirée',
    vibe: 'rave',
    genres: [],
    address: '',
    venue: '',
    selectedAddress: null,
    description: '',
    price: '',
  });

  function updateData(patch: Partial<EventFormData>) {
    setFormData(prev => ({ ...prev, ...patch }));
    // Clear relevant errors
    const keys = Object.keys(patch);
    setErrors(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });
  }

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!formData.name.trim()) errs.name = 'Le nom est requis';
      if (!formData.date) errs.date = 'La date est requise';
      if (formData.genres.length === 0) errs.genres = 'Choisissez au moins un genre';
    } else if (s === 1) {
      if (!formData.selectedAddress) errs.address = 'Sélectionnez une adresse dans la liste';
    } else if (s === 2) {
      if (!formData.description.trim()) errs.description = 'La description est requise';
      if (!formData.price.trim()) errs.price = 'Indiquez le prix';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep(prev => Math.max(prev - 1, 0));
  }

  function handleSubmit() {
    if (!formData.selectedAddress) return;
    setIsSubmitting(true);

    const startTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();
    const parts = formData.selectedAddress.display_name.split(', ');
    const city = parts[parts.length - 3] || parts[0];

    const newEvent: NightEvent = {
      id: `user-${Date.now()}`,
      name: formData.name.trim().toUpperCase(),
      type: formData.type,
      vibe: formData.vibe,
      genres: formData.genres,
      lat: parseFloat(formData.selectedAddress.lat),
      lng: parseFloat(formData.selectedAddress.lon),
      address: parts.slice(0, 2).join(', '),
      city,
      startTime,
      priceRange: derivePriceRange(formData.price),
      description: formData.description.trim(),
      venue: formData.venue.trim() || parts[0],
      imageColor: imageColors[Math.floor(Math.random() * imageColors.length)],
      isLive: false,
    };

    onAdd(newEvent);
    setIsSubmitting(false);
    handleClose();
  }

  function handleClose() {
    setStep(0);
    setFormData({
      name: '', date: '', time: '22:00', type: 'soirée', vibe: 'rave',
      genres: [], address: '', venue: '', selectedAddress: null,
      description: '', price: '',
    });
    setErrors({});
    onClose();
  }

  if (!open) return null;

  const isLastStep = step === STEPS.length - 1;

  return (
    <div
      className="absolute inset-0 z-[600] flex flex-col justify-end"
      style={{ background: 'hsl(258 60% 4% / 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: 'hsl(258 55% 9%)',
          boxShadow: '0 -8px 40px hsl(258 60% 4% / 0.9)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0"
          style={{ borderColor: 'hsl(258 40% 18%)' }}
        >
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:bg-surface-3"
                style={{ background: 'hsl(258 40% 14%)', borderColor: 'hsl(258 40% 22%)' }}
              >
                <ArrowLeft size={14} className="text-foreground" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">
                {STEPS[step].title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step].subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'hsl(258 40% 14%)', borderColor: 'hsl(258 40% 22%)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i <= step
                    ? 'linear-gradient(90deg, hsl(183 100% 50%), hsl(275 71% 58%))'
                    : 'hsl(258 40% 18%)',
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
            Étape {step + 1} / {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {step === 0 && <StepBasicInfo data={formData} onChange={updateData} errors={errors} />}
          {step === 1 && <StepLocation data={formData} onChange={updateData} errors={errors} />}
          {step === 2 && <StepDetails data={formData} onChange={updateData} errors={errors} />}
          {step === 3 && <StepPreview data={formData} />}
        </div>

        {/* Footer button */}
        <div className="px-5 pb-5 pt-3 shrink-0">
          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, hsl(183 100% 40%), hsl(275 71% 50%))',
                boxShadow: '0 4px 20px hsl(183 100% 50% / 0.3)',
                color: 'white',
              }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} />
                  Publier l'évènement
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: step === 2
                  ? 'linear-gradient(135deg, hsl(275 71% 50%), hsl(315 100% 53%))'
                  : 'hsl(258 40% 18%)',
                color: 'white',
              }}
            >
              {step === 2 ? (
                <>
                  <Eye size={16} />
                  Prévisualiser
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
