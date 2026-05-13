import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { EventFormData } from './types';

interface Props {
  data: EventFormData;
  onChange: (patch: Partial<EventFormData>) => void;
  errors: Record<string, string>;
}

export function StepDetails({ data, onChange, errors }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrl = data.imageFile ? URL.createObjectURL(data.imageFile) : null;

  return (
    <div className="space-y-5">
      {/* Image upload */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          🖼️ Affiche / Flyer (optionnel)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onChange({ imageFile: file });
          }}
        />
        {previewUrl ? (
          <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(258 40% 22%)' }}>
            <img src={previewUrl} alt="Aperçu de l'affiche de l'événement à publier" className="w-full h-40 object-cover" />
            <button
              onClick={() => { onChange({ imageFile: null }); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(0 0% 0% / 0.6)' }}
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ borderColor: 'hsl(258 40% 22%)', color: 'hsl(258 20% 50%)' }}
          >
            <ImagePlus size={24} />
            <span className="text-xs font-bold">Ajouter une image</span>
          </button>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Description *
        </label>
        <textarea
          value={data.description}
          onChange={e => onChange({ description: e.target.value })}
          maxLength={300}
          rows={4}
          placeholder="Décris l'ambiance, le programme, ce qui rend cet évènement unique..."
          className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none leading-relaxed"
          style={{
            background: 'hsl(258 40% 13%)',
            border: `1.5px solid ${errors.description ? 'hsl(0 80% 55%)' : 'hsl(258 40% 22%)'}`,
            color: 'hsl(240 20% 90%)',
          }}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-destructive">{errors.description}</p>
          ) : <span />}
          <span className="text-[10px] text-muted-foreground">{data.description.length}/300</span>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          💶 Prix d'entrée *
        </label>
        <div className="relative">
          <input
            value={data.price}
            onChange={e => onChange({ price: e.target.value })}
            placeholder="Ex: 15€, Gratuit, 10-20€..."
            maxLength={30}
            className="w-full h-11 px-4 rounded-xl text-sm font-medium outline-none transition-all"
            style={{
              background: 'hsl(258 40% 13%)',
              border: `1.5px solid ${errors.price ? 'hsl(0 80% 55%)' : 'hsl(258 40% 22%)'}`,
              color: 'hsl(240 20% 90%)',
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Indiquez le prix exact, nous gérerons la tranche automatiquement.
        </p>
        {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
      </div>
    </div>
  );
}
