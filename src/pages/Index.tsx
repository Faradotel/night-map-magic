import { useState, useEffect, useCallback, useMemo } from 'react';
import { EventMap } from '@/components/EventMap';
import { EventDetailPage } from '@/components/EventDetailPage';
import { MapEventCard } from '@/components/MapEventCard';
import { FilterBar, Filters } from '@/components/FilterBar';
import { BottomNav } from '@/components/BottomNav';
import { SearchScreen } from '@/components/SearchScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { FriendsScreen } from '@/components/FriendsScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { NotificationsSheet, useNotifications } from '@/components/NotificationsSheet';
import { useAuth } from '@/hooks/useAuth';
import { mockEvents, NightEvent, getDistance } from '@/data/mockEvents';
import { useAttendance } from '@/hooks/useAttendance';
import { usePreferredCity } from '@/hooks/usePreferredCity';
import { useUserRole } from '@/hooks/useUserRole';
import { AddEventSheet } from '@/components/AddEventSheet';
import { NightEvent as NightEventType } from '@/data/mockEvents';
import { useFavorites } from '@/hooks/useFavorites';

import { loadEventsForCity, loadEventsNearby, deduplicateEvents } from '@/lib/api/shotgun';
import { mapGenres, deduceVibe, deduceType, parsePriceRange } from '@/lib/api/shotgun';
import { LocationMode, City, LocationModeType, CITIES } from '@/components/LocationMode';
import { MapPin, Locate, Sliders, Bell, Plus } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'map' | 'search' | 'friends' | 'profile';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris
const DEFAULT_ZOOM = 12;
const NEARBY_RADIUS_DEFAULT = 15;
const CITY_RADIUS_DEFAULT = 40;

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useUserRole();
  const { preferredCity, setPreferredCity } = usePreferredCity();
  const savedCity = CITIES.find(c => c.name === preferredCity);
  const defaultCity = savedCity || CITIES.find(c => c.name === 'Paris')!;
  const initCenter: [number, number] = [defaultCity.lat, defaultCity.lng];

  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedEvent, setSelectedEvent] = useState<NightEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initCenter);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [locating, setLocating] = useState(false);
  const attendance = useAttendance();
  const favorites = useFavorites();
  const [showNotifications, setShowNotifications] = useState(false);
  const [allShotgunEvents, setAllShotgunEvents] = useState<NightEvent[]>([]);
  const [shotgunLoading, setShotgunLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [userEvents, setUserEvents] = useState<NightEventType[]>([]);
  const [locationMode, setLocationMode] = useState<LocationModeType>('nearby');
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [filterCenter, setFilterCenter] = useState<[number, number] | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    date: 'all',
    price: 'all',
    genres: [],
    vibes: [],
    radiusKm: NEARBY_RADIUS_DEFAULT
  });

  // Compute a loading key based on mode + city/location
  const currentLoadKey = locationMode === 'city' && selectedCityName
    ? `city:${selectedCityName}`
    : userLocation
      ? `nearby:${userLocation[0].toFixed(2)},${userLocation[1].toFixed(2)}`
      : null;

  // Load events from cache when city or location changes
  useEffect(() => {
    if (!currentLoadKey || currentLoadKey === loadedKey) return;

    let cancelled = false;
    async function load() {
      setShotgunLoading(true);
      try {
        let events: NightEvent[];
        if (locationMode === 'city' && selectedCityName) {
          events = await loadEventsForCity(selectedCityName);
        } else if (userLocation) {
          events = await loadEventsNearby(userLocation[0], userLocation[1], filters.radiusKm);
        } else {
          return;
        }
        if (!cancelled) {
          const deduped = deduplicateEvents(events);
          setAllShotgunEvents(deduped);
          setLoadedKey(currentLoadKey);
        }
      } finally {
        if (!cancelled) setShotgunLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentLoadKey, locationMode, selectedCityName, userLocation, filters.radiusKm, loadedKey]);

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
          setMapCenter(loc);
          setMapZoom(13);
        },
        () => { setLocating(false); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Filter events using filterCenter (user location or city center)
  const allEvents = useMemo(() => [...mockEvents, ...allShotgunEvents, ...userEvents], [allShotgunEvents, userEvents]);

  const filteredEvents = useMemo(() => allEvents.filter((event) => {
    if (filters.price === 'free' && event.priceRange !== 'gratuit') return false;
    if (filters.price === 'paid' && event.priceRange === 'gratuit') return false;

    if (filters.date !== 'all') {
      const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      const eventDate = new Date(new Date(event.startTime).toLocaleString('en-US', { timeZone: 'Europe/Paris' }));

      const todayEnd = new Date(parisNow);
      todayEnd.setHours(23, 59, 59, 999);

      const weekendStart = new Date(parisNow);
      const day = parisNow.getDay();
      const daysToSaturday = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
      weekendStart.setDate(parisNow.getDate() + daysToSaturday);
      weekendStart.setHours(0, 0, 0, 0);
      const weekendEnd = new Date(weekendStart);
      weekendEnd.setDate(weekendStart.getDate() + 1);
      weekendEnd.setHours(23, 59, 59, 999);

      const weekEnd = new Date(parisNow);
      weekEnd.setDate(parisNow.getDate() + 7);

      if (filters.date === 'today' && (eventDate < parisNow || eventDate > todayEnd)) return false;
      if (filters.date === 'weekend' && (eventDate < weekendStart || eventDate > weekendEnd)) return false;
      if (filters.date === 'week' && eventDate > weekEnd) return false;
    }

    if (filters.genres.length > 0 && !event.genres.some((g) => filters.genres.includes(g as any))) return false;
    if (filters.vibes.length > 0 && !filters.vibes.includes(event.vibe as any)) return false;

    if (filterCenter) {
      const dist = getDistance(filterCenter[0], filterCenter[1], event.lat, event.lng);
      if (dist > filters.radiusKm) return false;
    }

    return true;
  }), [allEvents, filters, filterCenter]);

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
    setPreferredCity(city.name);
    setLocationMode('city');
    const cityCenter: [number, number] = [city.lat, city.lng];
    setFilterCenter(cityCenter);
    setMapCenter(cityCenter);
    setMapZoom(12);
    setFilters((prev) => ({ ...prev, radiusKm: CITY_RADIUS_DEFAULT }));
  }, [setPreferredCity]);

  const handleLocate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('Géolocalisation non disponible');
      return;
    }
    setLocating(true);
    setLocationMode('nearby');
    setSelectedCityName(null);
    setLoadedKey(null); // Force reload for new location
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
      (err) => {
        console.error('Geolocation error:', err);
        setLocating(false);
        toast.error('Impossible d\'obtenir votre position');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function handleEventSelect(event: NightEvent) {
    setSelectedEvent(event);
    setShowDetail(false);
    setMapCenter([event.lat, event.lng]);
    if (activeTab !== 'map') setActiveTab('map');
  }



  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'var(--map-bg)' }}>
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
          style={{ background: 'var(--top-gradient)' }}>
          <div className="px-3 pt-10 pb-2 pointer-events-auto">
            {/* Row: Location pills left + Settings button right */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <LocationMode
                  mode={locationMode}
                  selectedCity={selectedCityName}
                  onModeChange={handleModeChange}
                  onCitySelect={handleCitySelect}
                  locating={locating} />
              </div>
              <button
                onClick={() => setShowNotifications(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center border shrink-0 relative"
                style={{
                  background: 'var(--controls-bg)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'var(--controls-border)',
                  boxShadow: 'var(--controls-shadow)',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <Bell size={16} />
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector('[data-filter-toggle]') as HTMLButtonElement;
                  el?.click();
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center border shrink-0"
                style={{
                  background: 'var(--controls-bg)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'var(--controls-border)',
                  boxShadow: 'var(--controls-shadow)',
                  color: 'hsl(var(--accent))',
                }}
              >
                <Sliders size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters (hidden toggle, uses data attribute) */}
        <FilterBar filters={filters} onChange={setFilters} isNearbyMode={locationMode === 'nearby' && userLocation !== null} />

        {/* ── Bottom right controls ── */}
        {/* Locate me */}
        <button
          onClick={handleLocate}
          disabled={locating}
          className="absolute right-3 z-[400] w-12 h-12 rounded-full flex items-center justify-center border transition-all"
          style={{
            bottom: selectedEvent ? '220px' : '80px',
            background: 'var(--controls-bg)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--controls-border)',
            boxShadow: 'var(--controls-shadow)',
            color: locating ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
          }}>
          <Locate size={20} className={locating ? 'animate-spin' : ''} />
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

        {/* Full event detail page */}
        {selectedEvent && showDetail && (
          <EventDetailPage
            event={selectedEvent}
            onClose={() => setShowDetail(false)}
            userLocation={userLocation}
            attendance={attendance}
          />
        )}
      </div>

      {/* ── SEARCH SCREEN ── */}
      {activeTab === 'search' &&
      <SearchScreen onEventSelect={handleEventSelect} events={filteredEvents} />
      }

      {/* ── FRIENDS SCREEN ── */}
      {activeTab === 'friends' &&
      <FriendsScreen allEvents={allEvents} attendance={attendance} />
      }

      {/* ── PROFILE SCREEN ── */}
      {activeTab === 'profile' &&
      <ProfileScreen />
      }

      {/* ── NOTIFICATIONS ── */}
      <NotificationsSheet
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onEventClick={(eventId) => {
          const ev = allEvents.find(e => e.id === eventId);
          if (ev) {
            handleEventSelect(ev);
            setShowNotifications(false);
          }
        }}
      />

      {/* ── ADD EVENT FAB (pro only) ── */}
      {isPro && activeTab === 'map' && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="absolute z-[450] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{
            bottom: selectedEvent ? '232px' : '92px',
            left: '16px',
            background: 'hsl(var(--accent))',
            boxShadow: '0 4px 20px hsl(var(--accent) / 0.5)',
          }}
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </button>
      )}

      {/* ── ADD EVENT SHEET ── */}
      <AddEventSheet
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onAdd={(event) => {
          setUserEvents(prev => [...prev, event]);
          toast.success('Événement ajouté !');
        }}
      />

      {/* ── BOTTOM NAV ── */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => {setActiveTab(tab);setSelectedEvent(null);}} />
    </div>);

}