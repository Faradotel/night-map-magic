import { useState, useEffect, useCallback } from 'react';
import { EventMap } from '@/components/EventMap';
import { EventDetailSheet } from '@/components/EventDetailSheet';
import { MapEventCard } from '@/components/MapEventCard';
import { FilterBar, Filters } from '@/components/FilterBar';
import { BottomNav } from '@/components/BottomNav';
import { SearchScreen } from '@/components/SearchScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { AddEventSheet } from '@/components/AddEventSheet';
import { mockEvents, NightEvent, getDistance } from '@/data/mockEvents';
import { reverseGeocodeCity, fetchShotgunEvents } from '@/lib/api/shotgun';
import { LocationMode, City, LocationModeType, CITIES } from '@/components/LocationMode';
import { MapPin, Locate, Plus, Search, Sliders } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'map' | 'search' | 'profile';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris
const DEFAULT_ZOOM = 12;
const NEARBY_RADIUS_DEFAULT = 15;
const CITY_RADIUS_DEFAULT = 40;

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedEvent, setSelectedEvent] = useState<NightEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [locating, setLocating] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [userEvents, setUserEvents] = useState<NightEvent[]>([]);
  const [allShotgunEvents, setAllShotgunEvents] = useState<NightEvent[]>([]);
  const [shotgunLoading, setShotgunLoading] = useState(false);
  const [shotgunLoaded, setShotgunLoaded] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationModeType>('nearby');
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [filterCenter, setFilterCenter] = useState<[number, number] | null>(null);
  const [filters, setFilters] = useState<Filters>({
    date: 'all',
    price: 'all',
    genres: [],
    vibes: [],
    radiusKm: NEARBY_RADIUS_DEFAULT
  });

  // Load all Shotgun events for all cities on mount
  useEffect(() => {
    if (shotgunLoaded) return;
    
    async function loadAllEvents() {
      setShotgunLoading(true);
      try {
        const results = await Promise.allSettled(
          CITIES.map(city => fetchShotgunEvents(city.name))
        );
        const allEvents = results
          .filter((r): r is PromiseFulfilledResult<NightEvent[]> => r.status === 'fulfilled')
          .flatMap(r => r.value);
        setAllShotgunEvents(allEvents);
        setShotgunLoaded(true);
        if (allEvents.length > 0) {
          toast.success(`${allEvents.length} événements chargés en France`);
        }
      } catch {
        // silent
      } finally {
        setShotgunLoading(false);
      }
    }

    loadAllEvents();
  }, [shotgunLoaded]);

  // Request geolocation on load
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setFilterCenter(loc);
          setLocating(false);
          if (pos.coords.latitude > 41 && pos.coords.latitude < 52 && pos.coords.longitude > -5 && pos.coords.longitude < 10) {
            setMapCenter(loc);
          }
        },
        () => { setLocating(false); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Filter events using filterCenter (user location or city center)
  const allEvents = [...mockEvents, ...userEvents, ...allShotgunEvents];

  const filteredEvents = allEvents.filter((event) => {
    if (filters.price === 'free' && event.priceRange !== 'gratuit') return false;
    if (filters.price === 'paid' && event.priceRange === 'gratuit') return false;

    if (filters.date !== 'all') {
      const eventDate = new Date(event.startTime);
      const now = new Date();
      const todayEnd = new Date(now);todayEnd.setHours(23, 59, 59);
      const weekendStart = new Date(now);
      const day = now.getDay();
      const daysToSaturday = day === 6 ? 0 : 6 - day;
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

    if (filters.genres.length > 0 && !event.genres.some((g) => filters.genres.includes(g as any))) return false;
    if (filters.vibes.length > 0 && !filters.vibes.includes(event.vibe as any)) return false;

    // Distance filter using filterCenter (works in both modes)
    if (filterCenter) {
      const dist = getDistance(filterCenter[0], filterCenter[1], event.lat, event.lng);
      if (dist > filters.radiusKm) return false;
    }

    return true;
  });

  // Switch to "nearby" mode
  const handleModeChange = useCallback((mode: LocationModeType) => {
    setLocationMode(mode);
    if (mode === 'nearby') {
      setSelectedCityName(null);
      setFilters((prev) => ({ ...prev, radiusKm: NEARBY_RADIUS_DEFAULT }));
      if (userLocation) {
        setFilterCenter(userLocation);
        setMapCenter(userLocation);
        setMapZoom(13);
      }
    }
  }, [userLocation]);

  // Handle manual city selection
  const handleCitySelect = useCallback((city: City) => {
    setSelectedCityName(city.name);
    setLocationMode('city');
    const cityCenter: [number, number] = [city.lat, city.lng];
    setFilterCenter(cityCenter);
    setMapCenter(cityCenter);
    setMapZoom(12);
    setFilters((prev) => ({ ...prev, radiusKm: CITY_RADIUS_DEFAULT }));
  }, []);

  const handleLocate = useCallback(() => {
    setLocating(true);
    setLocationMode('nearby');
    setSelectedCityName(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setFilterCenter(loc);
        setMapCenter(loc);
        setMapZoom(13);
        setLocating(false);
        setFilters((prev) => ({ ...prev, radiusKm: NEARBY_RADIUS_DEFAULT }));
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  function handleEventSelect(event: NightEvent) {
    setSelectedEvent(event);
    setShowDetail(false);
    setMapCenter([event.lat, event.lng]);
    if (activeTab !== 'map') setActiveTab('map');
  }

  function handleAddEvent(event: NightEvent) {
    setUserEvents((prev) => [...prev, event]);
    setSelectedEvent(event);
    setMapCenter([event.lat, event.lng]);
    setMapZoom(15);
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'hsl(230 60% 6%)' }}>
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
            radiusKm={filters.radiusKm} />
        </div>

        {/* ── Top Controls ── */}
        <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, hsl(230 60% 4% / 0.8) 0%, transparent 100%)' }}>
          <div className="px-3 pt-10 pb-2 space-y-3 pointer-events-auto">
            {/* Search bar + Filter button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('search'); setSelectedEvent(null); }}
                className="flex-1 flex items-center h-14 px-4 rounded-full border"
                style={{
                  background: 'rgba(26, 13, 21, 0.8)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'hsl(325 89% 50% / 0.1)',
                  boxShadow: '0 4px 20px hsl(230 60% 4% / 0.5)',
                }}
              >
                <Search size={18} style={{ color: 'hsl(325 89% 50%)' }} className="mr-3 shrink-0" />
                <span className="text-sm font-medium" style={{ color: 'hsl(225 15% 45%)' }}>
                  Où sort-on ce soir ?
                </span>
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector('[data-filter-toggle]') as HTMLButtonElement;
                  el?.click();
                }}
                className="w-14 h-14 rounded-full flex items-center justify-center border shrink-0"
                style={{
                  background: 'rgba(26, 13, 21, 0.8)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'hsl(325 89% 50% / 0.1)',
                  boxShadow: '0 4px 20px hsl(230 60% 4% / 0.5)',
                  color: 'hsl(325 89% 50%)',
                }}
              >
                <Sliders size={18} />
              </button>
            </div>

            {/* Location mode + filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden pb-1">
              <LocationMode
                mode={locationMode}
                selectedCity={selectedCityName}
                onModeChange={handleModeChange}
                onCitySelect={handleCitySelect}
                locating={locating} />
            </div>
          </div>
        </div>

        {/* Filters (hidden toggle, uses data attribute) */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* ── Bottom right controls ── */}
        {/* Locate me */}
        <button
          onClick={handleLocate}
          disabled={locating}
          className="absolute right-3 z-[400] w-12 h-12 rounded-full flex items-center justify-center border transition-all"
          style={{
            bottom: selectedEvent ? '220px' : '80px',
            background: 'rgba(26, 13, 21, 0.8)',
            backdropFilter: 'blur(12px)',
            borderColor: 'hsl(325 89% 50% / 0.1)',
            boxShadow: '0 4px 20px hsl(230 60% 4% / 0.5)',
            color: locating ? 'hsl(325 89% 50%)' : 'hsl(225 20% 80%)',
          }}>
          <Locate size={20} className={locating ? 'animate-spin' : ''} />
        </button>

        {/* Add event */}
        <button
          onClick={() => setShowAddEvent(true)}
          className="absolute right-3 z-[400] w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            bottom: selectedEvent ? '276px' : '136px',
            background: 'hsl(325 89% 50%)',
            boxShadow: '0 0 20px hsl(325 89% 50% / 0.5), 0 4px 16px hsl(230 60% 4% / 0.6)',
          }}>
          <Plus size={20} className="text-white" />
        </button>

        {/* Small event preview card on map */}
        {selectedEvent && (
          <MapEventCard
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDetails={() => setShowDetail(true)}
            userLocation={userLocation}
          />
        )}

        {/* Full event detail sheet */}
        {selectedEvent && showDetail && (
          <EventDetailSheet
            event={selectedEvent}
            onClose={() => setShowDetail(false)}
          />
        )}

        {/* Add event sheet */}
        <AddEventSheet
          open={showAddEvent}
          onClose={() => setShowAddEvent(false)}
          onAdd={handleAddEvent} />
      </div>

      {/* ── SEARCH SCREEN ── */}
      {activeTab === 'search' &&
      <SearchScreen onEventSelect={handleEventSelect} events={filteredEvents} />
      }

      {/* ── PROFILE SCREEN ── */}
      {activeTab === 'profile' &&
      <ProfileScreen />
      }

      {/* ── BOTTOM NAV ── */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => {setActiveTab(tab);setSelectedEvent(null);}} />
    </div>);

}