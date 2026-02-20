import { useState, useEffect, useCallback } from 'react';
import { EventMap } from '@/components/EventMap';
import { EventDetailSheet } from '@/components/EventDetailSheet';
import { FilterBar, Filters } from '@/components/FilterBar';
import { BottomNav } from '@/components/BottomNav';
import { SearchScreen } from '@/components/SearchScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { AddEventSheet } from '@/components/AddEventSheet';
import { mockEvents, NightEvent, getDistance } from '@/data/mockEvents';
import { MapPin, Locate, Plus } from 'lucide-react';

type Tab = 'map' | 'search' | 'profile';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris
const DEFAULT_ZOOM = 12;

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedEvent, setSelectedEvent] = useState<NightEvent | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [locating, setLocating] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [userEvents, setUserEvents] = useState<NightEvent[]>([]);
  const [filters, setFilters] = useState<Filters>({
    date: 'all',
    price: 'all',
    genres: [],
    vibes: [],
    radiusKm: 10,
  });

  // Request geolocation on load
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          // Only center on user if they appear to be in France
          if (pos.coords.latitude > 41 && pos.coords.latitude < 52 && pos.coords.longitude > -5 && pos.coords.longitude < 10) {
            setMapCenter(loc);
          }
        },
        () => {/* permission denied, keep Paris center */},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Filter events
  const allEvents = [...mockEvents, ...userEvents];

  const filteredEvents = allEvents.filter(event => {
    // Price filter
    if (filters.price === 'free' && event.priceRange !== 'gratuit') return false;
    if (filters.price === 'paid' && event.priceRange === 'gratuit') return false;

    // Date filter
    if (filters.date !== 'all') {
      const eventDate = new Date(event.startTime);
      const now = new Date();
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59);
      const weekendStart = new Date(now);
      const day = now.getDay();
      const daysToSaturday = day === 6 ? 0 : (6 - day);
      weekendStart.setDate(now.getDate() + daysToSaturday);
      weekendStart.setHours(0, 0, 0);
      const weekendEnd = new Date(weekendStart);
      weekendEnd.setDate(weekendStart.getDate() + 1);
      weekendEnd.setHours(23, 59, 59);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);

      if (filters.date === 'today' && eventDate > todayEnd) return false;
      if (filters.date === 'weekend' && (eventDate < weekendStart || eventDate > weekendEnd)) return false;
      if (filters.date === 'week' && eventDate > weekEnd) return false;
    }

    // Genre filter
    if (filters.genres.length > 0 && !event.genres.some(g => filters.genres.includes(g as any))) return false;

    // Vibe filter
    if (filters.vibes.length > 0 && !filters.vibes.includes(event.vibe as any)) return false;

    // Distance filter (only if user location known)
    if (userLocation) {
      const dist = getDistance(userLocation[0], userLocation[1], event.lat, event.lng);
      if (dist > filters.radiusKm) return false;
    }

    return true;
  });

  const handleLocate = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setMapZoom(13);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  function handleEventSelect(event: NightEvent) {
    setSelectedEvent(event);
    setMapCenter([event.lat, event.lng]);
    if (activeTab !== 'map') setActiveTab('map');
  }

  function handleAddEvent(event: NightEvent) {
    setUserEvents(prev => [...prev, event]);
    setSelectedEvent(event);
    setMapCenter([event.lat, event.lng]);
    setMapZoom(15);
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'hsl(258 60% 8%)' }}>
      {/* ── MAP SCREEN (always mounted, hidden via visibility) ── */}
      <div className="absolute inset-0" style={{ visibility: activeTab === 'map' ? 'visible' : 'hidden' }}>
        {/* Map */}
        <div className="absolute inset-0 bottom-16">
          <EventMap
            events={filteredEvents}
            center={mapCenter}
            zoom={mapZoom}
            onEventSelect={setSelectedEvent}
            selectedEvent={selectedEvent}
            userLocation={userLocation}
            radiusKm={filters.radiusKm}
          />
        </div>

        {/* Filters */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* App title overlay */}
        <div
          className="absolute top-14 left-3 z-[400] pointer-events-none"
          style={{ opacity: 0.9 }}
        >
        </div>

        {/* Add event button */}
        <button
          onClick={() => setShowAddEvent(true)}
          className="absolute right-3 bottom-32 z-[400] w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: 'linear-gradient(135deg, hsl(183 100% 40%), hsl(275 71% 50%))',
            boxShadow: '0 0 16px hsl(183 100% 50% / 0.5), 0 2px 12px hsl(258 60% 4% / 0.6)',
          }}
        >
          <Plus size={18} className="text-white" />
        </button>

        {/* Locate me button */}
        <button
          onClick={handleLocate}
          disabled={locating}
          className="absolute right-3 bottom-20 z-[400] w-10 h-10 rounded-full flex items-center justify-center border border-surface-4 transition-all"
          style={{
            background: 'hsl(258 55% 11% / 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 12px hsl(258 60% 4% / 0.6)',
            color: locating ? 'hsl(183 100% 50%)' : 'hsl(240 20% 70%)',
          }}
        >
          <Locate size={17} className={locating ? 'animate-spin' : ''} />
        </button>

        {/* Event count badge */}
        <div
          className="absolute right-3 bottom-44 z-[400] px-2.5 py-1.5 rounded-full border border-surface-4 flex items-center gap-1.5"
          style={{
            background: 'hsl(258 55% 11% / 0.95)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" style={{ boxShadow: '0 0 6px hsl(183 100% 50%)' }} />
          <span className="text-xs font-bold text-neon-cyan">{filteredEvents.length}</span>
          <span className="text-[10px] text-muted-foreground">événements</span>
        </div>

        {/* Event detail sheet */}
        {selectedEvent && (
          <EventDetailSheet
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}

        {/* Add event sheet */}
        <AddEventSheet
          open={showAddEvent}
          onClose={() => setShowAddEvent(false)}
          onAdd={handleAddEvent}
        />
      </div>

      {/* ── SEARCH SCREEN ── */}
      {activeTab === 'search' && (
        <SearchScreen onEventSelect={handleEventSelect} />
      )}



      {/* ── PROFILE SCREEN ── */}
      {activeTab === 'profile' && (
        <ProfileScreen />
      )}

      {/* ── BOTTOM NAV ── */}
      <BottomNav activeTab={activeTab} onTabChange={tab => { setActiveTab(tab); setSelectedEvent(null); }} />

      {/* Header wordmark - always visible */}
      <div
        className="absolute top-0 left-0 right-0 h-12 z-[500] pointer-events-none flex items-center px-4"
        style={{
          background: activeTab === 'map'
            ? 'linear-gradient(to bottom, hsl(258 60% 8% / 0.85) 0%, transparent 100%)'
            : 'transparent',
          display: activeTab !== 'map' ? 'none' : 'flex',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(183 100% 40%), hsl(275 71% 50%))',
              boxShadow: '0 0 12px hsl(183 100% 50% / 0.4)',
            }}
          >
            <MapPin size={14} className="text-white" />
          </div>
          <span
            className="text-base font-black tracking-tight"
            style={{
              background: 'linear-gradient(90deg, hsl(183 100% 60%), hsl(275 71% 70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            NightMap
          </span>
        </div>
      </div>
    </div>
  );
}
