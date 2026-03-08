import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Loader2, CheckCircle } from 'lucide-react';
import { EventFormData, GeocodeResult } from './types';

interface Props {
  data: EventFormData;
  onChange: (patch: Partial<EventFormData>) => void;
  errors: Record<string, string>;
}

export function StepLocation({ data, onChange, errors }: Props) {
  const [addressQuery, setAddressQuery] = useState(data.selectedAddress?.display_name || '');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (addressQuery.length < 5) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=4&countrycodes=fr,be,ch`,
          { headers: { 'Accept-Language': 'fr' } }
        );
        const results: GeocodeResult[] = await res.json();
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  }, [addressQuery]);

  function selectAddress(result: GeocodeResult) {
    onChange({
      selectedAddress: result,
      address: result.display_name,
    });
    setAddressQuery(result.display_name);
    setSuggestions([]);
  }

  return (
    <div className="space-y-5">
      {/* Address search */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Adresse *
        </label>
        <div className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={addressQuery}
              onChange={e => {
                setAddressQuery(e.target.value);
                onChange({ selectedAddress: null });
              }}
              placeholder="Rechercher une adresse..."
              className="w-full h-11 pl-9 pr-4 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'hsl(258 40% 13%)',
                border: `1.5px solid ${errors.address ? 'hsl(0 80% 55%)' : data.selectedAddress ? 'hsl(183 100% 50% / 0.6)' : 'hsl(258 40% 22%)'}`,
                color: 'hsl(240 20% 90%)',
              }}
            />
            {isSearching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
            )}
            {data.selectedAddress && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(183 100% 50%)' }}
              >
                <span className="text-[8px] font-black" style={{ color: 'hsl(258 60% 8%)' }}>✓</span>
              </div>
            )}
          </div>
          {suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-10"
              style={{
                background: 'hsl(258 55% 11%)',
                boxShadow: '0 8px 24px hsl(258 60% 4% / 0.8)',
                borderColor: 'hsl(258 40% 22%)',
              }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectAddress(s)}
                  className="w-full text-left px-4 py-3 text-xs flex items-start gap-2 border-b last:border-b-0 transition-colors hover:bg-surface-3"
                  style={{ borderColor: 'hsl(258 40% 18%)' }}
                >
                  <MapPin size={12} className="mt-0.5 shrink-0 text-neon-cyan" />
                  <span className="text-foreground leading-relaxed">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
      </div>

      {/* Map preview when address selected */}
      {data.selectedAddress && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Confirmer la position
          </label>
          <div
            className="w-full h-48 rounded-2xl overflow-hidden border"
            style={{ borderColor: 'hsl(258 40% 22%)' }}
          >
            <iframe
              title="map-preview"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(1.1) contrast(1.1)' }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(data.selectedAddress.lon) - 0.005},${parseFloat(data.selectedAddress.lat) - 0.003},${parseFloat(data.selectedAddress.lon) + 0.005},${parseFloat(data.selectedAddress.lat) + 0.003}&layer=mapnik&marker=${data.selectedAddress.lat},${data.selectedAddress.lon}`}
            />
          </div>
          <div className="flex items-center gap-2 px-1">
            <CheckCircle size={14} style={{ color: 'hsl(183 100% 50%)' }} />
            <span className="text-xs text-muted-foreground leading-snug">
              {data.selectedAddress.display_name}
            </span>
          </div>
        </div>
      )}

      {/* Venue name */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Nom du lieu <span className="font-normal normal-case opacity-60">(optionnel)</span>
        </label>
        <input
          value={data.venue}
          onChange={e => onChange({ venue: e.target.value })}
          maxLength={60}
          placeholder="Ex: Le Rex Club, La Cigale..."
          className="w-full h-11 px-4 rounded-xl text-sm outline-none"
          style={{
            background: 'hsl(258 40% 13%)',
            border: '1.5px solid hsl(258 40% 22%)',
            color: 'hsl(240 20% 90%)',
          }}
        />
      </div>
    </div>
  );
}
