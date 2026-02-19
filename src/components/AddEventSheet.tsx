import { useState, useRef, useEffect } from 'react';
import { X, MapPin, Search, Loader2, Plus, Calendar, Clock, Tag } from 'lucide-react';
import { NightEvent, EventVibe, MusicGenre, PriceRange } from '@/data/mockEvents';

interface AddEventSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: NightEvent) => void;
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const vibeOptions: { key: EventVibe; label: string; emoji: string }[] = [
  { key: 'rave', label: 'Rave', emoji: '⚡' },
  { key: 'chill', label: 'Chill', emoji: '🌊' },
  { key: 'afterwork', label: 'Afterwork', emoji: '🥂' },
  { key: 'cosy', label: 'Cosy', emoji: '🕯️' },
  { key: 'concert', label: 'Concert', emoji: '🎸' },
];

const typeOptions = [
  { key: 'soirée', label: 'Soirée', emoji: '🎉' },
  { key: 'club', label: 'Club', emoji: '🎧' },
  { key: 'bar', label: 'Bar', emoji: '🍸' },
  { key: 'concert', label: 'Concert', emoji: '🎸' },
  { key: 'afterwork', label: 'Afterwork', emoji: '🥂' },
] as const;

const genreOptions: MusicGenre[] = ['electro', 'techno', 'house', 'pop', 'rock', 'indie', 'r&b', 'jazz'];
const priceOptions: { key: PriceRange; label: string }[] = [
  { key: 'gratuit', label: 'Gratuit' },
  { key: '€1-10', label: '€1-10' },
  { key: '€10-20', label: '€10-20' },
  { key: '€20+', label: '€20+' },
];

const imageColors = ['#1a0f2e', '#0f1a2e', '#0a1020', '#1a0a0a', '#0a1a10', '#1a1400', '#1a100a'];

export function AddEventSheet({ open, onClose, onAdd }: AddEventSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<GeocodeResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [vibe, setVibe] = useState<EventVibe>('rave');
  const [type, setType] = useState<NightEvent['type']>('soirée');
  const [genres, setGenres] = useState<MusicGenre[]>([]);
  const [price, setPrice] = useState<PriceRange>('€1-10');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('22:00');
  const [venue, setVenue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Geocode address using Nominatim (OpenStreetMap - free)
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
        const data: GeocodeResult[] = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  }, [addressQuery]);

  function selectAddress(result: GeocodeResult) {
    setSelectedAddress(result);
    setAddress(result.display_name);
    setAddressQuery(result.display_name);
    setSuggestions([]);
  }

  function toggleGenre(g: MusicGenre) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Le nom est requis';
    if (!selectedAddress) errs.address = 'Veuillez sélectionner une adresse dans la liste';
    if (!description.trim()) errs.description = 'La description est requise';
    if (!date) errs.date = 'La date est requise';
    if (genres.length === 0) errs.genres = 'Choisissez au moins un genre';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !selectedAddress) return;
    setIsSubmitting(true);

    const startTime = new Date(`${date}T${time}:00`).toISOString();
    const parts = selectedAddress.display_name.split(', ');
    const city = parts[parts.length - 3] || parts[0];

    const newEvent: NightEvent = {
      id: `user-${Date.now()}`,
      name: name.trim().toUpperCase(),
      type,
      vibe,
      genres,
      lat: parseFloat(selectedAddress.lat),
      lng: parseFloat(selectedAddress.lon),
      address: parts.slice(0, 2).join(', '),
      city,
      startTime,
      priceRange: price,
      description: description.trim(),
      venue: venue.trim() || parts[0],
      imageColor: imageColors[Math.floor(Math.random() * imageColors.length)],
      isLive: false,
    };

    onAdd(newEvent);
    setIsSubmitting(false);
    handleClose();
  }

  function handleClose() {
    setName(''); setDescription(''); setAddress(''); setAddressQuery('');
    setSelectedAddress(null); setSuggestions([]);
    setVibe('rave'); setType('soirée'); setGenres([]); setPrice('€1-10');
    setDate(''); setTime('22:00'); setVenue(''); setErrors({});
    onClose();
  }

  if (!open) return null;

  const todayStr = new Date().toISOString().split('T')[0];

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
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-4 shrink-0"
          style={{ borderColor: 'hsl(258 40% 18%)' }}
        >
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">Ajouter un évènement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Visible sur la carte instantanément</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-surface-4 text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'hsl(258 40% 14%)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Event name */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Nom de l'évènement *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
              placeholder="Ex: Nuit Électrique, Jazz Night..."
              className="w-full h-11 px-4 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: 'hsl(258 40% 13%)',
                border: `1.5px solid ${errors.name ? 'hsl(0 80% 55%)' : 'hsl(258 40% 22%)'}`,
                color: 'hsl(240 20% 90%)',
              }}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Address with autocomplete */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Adresse *
            </label>
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={addressQuery}
                  onChange={e => { setAddressQuery(e.target.value); setSelectedAddress(null); }}
                  placeholder="Rechercher une adresse en France..."
                  className="w-full h-11 pl-9 pr-4 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'hsl(258 40% 13%)',
                    border: `1.5px solid ${errors.address ? 'hsl(0 80% 55%)' : selectedAddress ? 'hsl(183 100% 50% / 0.6)' : 'hsl(258 40% 22%)'}`,
                    color: 'hsl(240 20% 90%)',
                  }}
                />
                {isSearching && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                )}
                {selectedAddress && (
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
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-surface-4 overflow-hidden z-10"
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

          {/* Venue name (optional) */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Nom du lieu <span className="font-normal normal-case opacity-60">(optionnel)</span>
            </label>
            <input
              value={venue}
              onChange={e => setVenue(e.target.value)}
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Calendar size={10} /> Date *
              </label>
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={e => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'hsl(258 40% 13%)',
                  border: `1.5px solid ${errors.date ? 'hsl(0 80% 55%)' : 'hsl(258 40% 22%)'}`,
                  color: date ? 'hsl(240 20% 90%)' : 'hsl(240 20% 50%)',
                  colorScheme: 'dark',
                }}
              />
              {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Clock size={10} /> Heure
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'hsl(258 40% 13%)',
                  border: '1.5px solid hsl(258 40% 22%)',
                  color: 'hsl(240 20% 90%)',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Description *
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
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
              <span className="text-[10px] text-muted-foreground">{description.length}/300</span>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Type d'évènement
            </label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map(t => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className="h-8 px-3 rounded-xl text-xs font-semibold border transition-all"
                  style={{
                    background: type === t.key ? 'hsl(275 71% 58% / 0.2)' : 'hsl(258 40% 13%)',
                    borderColor: type === t.key ? 'hsl(275 71% 58%)' : 'hsl(258 40% 22%)',
                    color: type === t.key ? 'hsl(275 71% 70%)' : 'hsl(240 20% 60%)',
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Ambiance
            </label>
            <div className="flex gap-2 flex-wrap">
              {vibeOptions.map(v => (
                <button
                  key={v.key}
                  onClick={() => setVibe(v.key)}
                  className="h-8 px-3 rounded-xl text-xs font-semibold border transition-all"
                  style={{
                    background: vibe === v.key ? 'hsl(183 100% 50% / 0.15)' : 'hsl(258 40% 13%)',
                    borderColor: vibe === v.key ? 'hsl(183 100% 50%)' : 'hsl(258 40% 22%)',
                    color: vibe === v.key ? 'hsl(183 100% 60%)' : 'hsl(240 20% 60%)',
                  }}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Tag size={10} /> Genres musicaux *
            </label>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="h-7 px-3 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: genres.includes(g) ? 'hsl(315 100% 53% / 0.2)' : 'hsl(258 40% 13%)',
                    borderColor: genres.includes(g) ? 'hsl(315 100% 53%)' : 'hsl(258 40% 22%)',
                    color: genres.includes(g) ? 'hsl(315 100% 70%)' : 'hsl(240 20% 60%)',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
            {errors.genres && <p className="text-xs text-destructive mt-1">{errors.genres}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              💶 Tarif
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priceOptions.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPrice(p.key)}
                  className="h-9 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    background: price === p.key ? 'hsl(45 100% 55% / 0.2)' : 'hsl(258 40% 13%)',
                    borderColor: price === p.key ? 'hsl(45 100% 55%)' : 'hsl(258 40% 22%)',
                    color: price === p.key ? 'hsl(45 100% 65%)' : 'hsl(240 20% 60%)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
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
                Ajouter sur la carte
              </>
            )}
          </button>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
