import { EventFormData } from './types';

interface Props {
  data: EventFormData;
  onChange: (patch: Partial<EventFormData>) => void;
  errors: Record<string, string>;
}

export function StepDetails({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-5">
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

      {/* Price - free text input */}
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
