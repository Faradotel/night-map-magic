import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EventMap } from '@/components/EventMap';
import { EventDetailPage } from '@/components/EventDetailPage';
import { MapEventCard } from '@/components/MapEventCard';
import { FilterBar, Filters, SOURCE_OPTIONS } from '@/components/FilterBar';
import { BottomNav } from '@/components/BottomNav';
import { LegalFooter } from '@/components/LegalFooter';
import { SearchScreen } from '@/components/SearchScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { FriendsScreen } from '@/components/FriendsScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { NotificationsSheet, useNotifications } from '@/components/NotificationsSheet';
import { useAuth } from '@/hooks/useAuth';
import { mockEvents, NightEvent, EventType, getDistance } from '@/data/mockEvents';
import { useAttendance } from '@/hooks/useAttendance';
import { usePreferredCity } from '@/hooks/usePreferredCity';
import { useUserRole } from '@/hooks/useUserRole';
import { AddEventSheet } from '@/components/AddEventSheet';
import { NightEvent as NightEventType } from '@/data/mockEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useOfflineEvents } from '@/hooks/useOfflineEvents';

import { loadEventsForCity, loadEventsNearby, loadAllEvents, deduplicateEvents } from '@/lib/api/shotgun';
import { mapGenres, deduceVibe, deduceType, parsePriceRange } from '@/lib/api/shotgun';
import { LocationMode, City, LocationModeType, CITIES, findNearestCity } from '@/components/LocationMode';
import { MapPin, Locate, Sliders, Bell, Plus, Zap, Flame, ShieldCheck } from 'lucide-react';
import { useSafePlaces } from '@/hooks/useSafePlaces';
import safeShieldLogo from '@/assets/safe-shield.png';
import { toast } from 'sonner';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { TonightsHotspotsBanner } from '@/components/TonightsHotspotsBanner';
import { LiveTicker } from '@/components/LiveTicker';
import { SEO } from '@/components/SEO';
import { organizationLd, websiteLd } from '@/lib/seo/jsonld';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useShouldShowOnboarding, useOnboardingPreferences, InterestTag, tagsToFilterPatch } from '@/hooks/useOnboardingPreferences';

type Tab = 'map' | 'search' | 'friends' | 'profile';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris
const DEFAULT_ZOOM = 12;
const NEARBY_RADIUS_DEFAULT = 30;
const CITY_RADIUS_DEFAULT = 80;

const FRANCE_CENTER: [number, number] = [46.2276, 2.2137];
const FRANCE_ZOOM = 6;

// Most sources don't provide an endTime, so LIVE mode has to guess how long an
// event runs. A flat 4h default cuts nightlife events short — soirées/clubs
// routinely run past midnight (e.g. 19h→2h) — so the fallback duration is
// type-aware instead of one-size-fits-all.
const DEFAULT_DURATION_HOURS_BY_TYPE: Partial<Record<EventType, number>> = {
  nightlife: 7,
  soirée: 7,
  club: 7,
  bar: 7,
  afterwork: 5,
  festival: 8,
  concert: 3,
  spectacle: 2.5,
  théâtre: 2.5,
  cinema: 2.5,
  expo: 3,
  culture: 3,
  sport: 3,
  famille: 4,
  brocante: 4,
};
const DEFAULT_DURATION_HOURS_FALLBACK = 4;

function getDefaultDurationMs(type: EventType): number {
  return (DEFAULT_DURATION_HOURS_BY_TYPE[type] ?? DEFAULT_DURATION_HOURS_FALLBACK) * 60 * 60 * 1000;
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useUserRole();
  const { preferredCity, setPreferredCity } = usePreferredCity();
  const { show: showOnboarding, complete: completeOnboarding } = useShouldShowOnboarding();
  const { tags: onboardingTags, setTags: setOnboardingTags } = useOnboardingPreferences();
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const savedCity = preferredCity ? CITIES.find(c => c.name === preferredCity) : null;
  // Default mode: city if saved, otherwise France
  const initMode: LocationModeType = savedCity ? 'city' : 'france';
  const initCenter: [number, number] = savedCity ? [savedCity.lat, savedCity.lng] : FRANCE_CENTER;
  const initZoom = savedCity ? DEFAULT_ZOOM : FRANCE_ZOOM;

  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedEvent, setSelectedEvent] = useState<NightEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initCenter);
  const [mapZoom, setMapZoom] = useState(initZoom);
  const [mapFocusTarget, setMapFocusTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const attendance = useAttendance();
  const favorites = useFavorites();
  const { cacheEvents, getCachedEvents, isOffline } = useOfflineEvents();
  const [showNotifications, setShowNotifications] = useState(false);
  const [allShotgunEvents, setAllShotgunEvents] = useState<NightEvent[]>([]);
  const [shotgunLoading, setShotgunLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [userEvents, setUserEvents] = useState<NightEventType[]>([]);
  const [locationMode, setLocationMode] = useState<LocationModeType>(initMode);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(savedCity ? savedCity.name : null);
  const [filterCenter, setFilterCenter] = useState<[number, number] | null>(savedCity ? [savedCity.lat, savedCity.lng] : null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loadIdRef = useRef(0);
  const [showLivePulse, setShowLivePulse] = useState(false);
  const [showSafePlaces, setShowSafePlaces] = useState(false);
  const { data: safePlaces } = useSafePlaces({ enabled: showSafePlaces });
  const [eventCountBadge, setEventCountBadge] = useState<number | null>(null);
  const eventCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showEventCountBadge = useCallback((count: number) => {
    if (eventCountTimerRef.current) clearTimeout(eventCountTimerRef.current);
    setEventCountBadge(count);
    eventCountTimerRef.current = setTimeout(() => setEventCountBadge(null), 3000);
  }, []);
  useEffect(() => () => { if (eventCountTimerRef.current) clearTimeout(eventCountTimerRef.current); }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedCity = useRef(false);
  const hasProcessedEvent = useRef(false);
  const { liveCountById: liveCountByIdRaw, events: liveEvents } = useLiveEvents({
    enabled: showLivePulse,
    sinceHours: 6,
    limit: 60,
  });
  const livePulseMap = showLivePulse ? liveCountByIdRaw : undefined;
  const [filters, setFilters] = useState<Filters>({
    date: 'all',
    price: 'all',
    genres: [],
    vibes: [],
    sources: [],
    radiusKm: savedCity ? CITY_RADIUS_DEFAULT : initMode === 'france' ? 9999 : NEARBY_RADIUS_DEFAULT,
    ...tagsToFilterPatch(onboardingTags),
  });

  // Compute a loading key based on mode + city/location
  const currentLoadKey = locationMode === 'france'
    ? 'france'
    : locationMode === 'city' && selectedCityName
      ? `city:${selectedCityName}`
      : userLocation
        ? `nearby:${userLocation[0].toFixed(2)},${userLocation[1].toFixed(2)}`
        : null;

  // Load events from cache when city or location changes
  useEffect(() => {
    if (!currentLoadKey || currentLoadKey === loadedKey) return;

    const myLoadId = ++loadIdRef.current;
    setShotgunLoading(true);

    async function load() {
      // Immediately show cached events so the map never goes blank during refresh
      const cached = getCachedEvents();
      if (cached && cached.length > 0 && myLoadId === loadIdRef.current) {
        setAllShotgunEvents(cached);
      }

      // Offline: stay on cache, don't attempt network
      if (!navigator.onLine) {
        if (cached && cached.length > 0 && myLoadId === loadIdRef.current) {
          setLoadedKey(currentLoadKey);
          toast.info('Mode hors-ligne — événements en cache');
        }
        if (myLoadId === loadIdRef.current) setShotgunLoading(false);
        return;
      }

      try {
        let events: NightEvent[];
        if (locationMode === 'france') {
          events = await loadAllEvents();
        } else if (locationMode === 'city' && selectedCityName) {
          const cityObj = CITIES.find(c => c.name === selectedCityName);
          events = await loadEventsForCity(
            selectedCityName,
            cityObj ? { lat: cityObj.lat, lng: cityObj.lng } : undefined,
            50,
          );
        } else if (userLocation) {
          events = await loadEventsNearby(userLocation[0], userLocation[1], filters.radiusKm);
        } else {
          if (myLoadId === loadIdRef.current) setShotgunLoading(false);
          return;
        }

        if (myLoadId !== loadIdRef.current) return;

        const deduped = deduplicateEvents(events);
        setAllShotgunEvents(deduped);
        setLoadedKey(currentLoadKey);
        cacheEvents(deduped);

        if (deduped.length === 0) {
          const label = locationMode === 'france' ? 'France' : locationMode === 'city' && selectedCityName ? selectedCityName : 'votre zone';
          toast.warning(`Aucun événement trouvé pour ${label} — données en cours de mise à jour`);
        } else {
          toast.success(`${deduped.length} événement${deduped.length > 1 ? 's' : ''} chargé${deduped.length > 1 ? 's' : ''}`, { duration: 2000 });
        }
      } catch {
        if (myLoadId !== loadIdRef.current) return;
        // Network error — try offline cache
        const cached = getCachedEvents();
        if (cached && cached.length > 0) {
          setAllShotgunEvents(cached);
          setLoadedKey(currentLoadKey);
          toast.info('Connexion perdue — événements en cache');
        } else {
          toast.error('Impossible de charger les événements — vérifiez votre connexion');
        }
      } finally {
        if (myLoadId === loadIdRef.current) setShotgunLoading(false);
      }
    }
    load();
  }, [currentLoadKey, locationMode, selectedCityName, userLocation, filters.radiusKm, loadedKey, cacheEvents, getCachedEvents]);

  // Request geolocation on load
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    // The onboarding flow owns geolocation entirely during first visit (its own
    // "Utiliser ma position" button makes its own getCurrentPosition call). Firing
    // this background request at the same time creates two concurrent geolocation
    // requests — several browsers (mobile Safari in particular) never resolve the
    // second one, success or error, leaving its spinner stuck forever.
    if (showOnboarding) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setLocating(false);

        // If no city was previously saved, try to detect a nearby French city
        // and use it as the default — otherwise keep France-wide view.
        // Skip the auto-recenter when arriving from a deep link (?event= or ?city=)
        // so the user stays focused on the targeted event/city.
        const arrivingFromDeepLink = !!(searchParams.get('event') || searchParams.get('city'))
          || hasProcessedEvent.current || hasProcessedCity.current;
        if (!savedCity && !arrivingFromDeepLink) {
          const nearest = findNearestCity(loc[0], loc[1]);
          if (nearest) {
            setSelectedCityName(nearest.name);
            setPreferredCity(nearest.name);
            setLocationMode('city');
            setFilterCenter([nearest.lat, nearest.lng]);
            setMapCenter([nearest.lat, nearest.lng]);
            setMapZoom(DEFAULT_ZOOM);
            setFilters((prev) => ({ ...prev, radiusKm: CITY_RADIUS_DEFAULT }));
          }
        }
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter events using filterCenter (user location or city center)
  const allEvents = useMemo(() => [...mockEvents, ...allShotgunEvents, ...userEvents], [allShotgunEvents, userEvents]);

  const filteredEvents = useMemo(() => allEvents.filter((event) => {
    // ── LIVE MODE: en cours, à venir aujourd'hui/cette nuit, ou avec check-ins ──
    if (showLivePulse) {
      const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      const eventStart = new Date(new Date(event.startTime).toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      const eventEnd = event.endTime
        ? new Date(new Date(event.endTime).toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
        : new Date(eventStart.getTime() + getDefaultDurationMs(event.type));
      // Fenêtre "ce soir" : jusqu'à 6h du matin le lendemain (heure de Paris)
      const tonightEnd = new Date(parisNow);
      if (parisNow.getHours() < 6) {
        tonightEnd.setHours(6, 0, 0, 0);
      } else {
        tonightEnd.setDate(parisNow.getDate() + 1);
        tonightEnd.setHours(6, 0, 0, 0);
      }
      const startsTonight = eventStart >= parisNow && eventStart <= tonightEnd;
      const isOngoing = eventStart <= parisNow && eventEnd >= parisNow;
      const hasCheckIns = (liveCountByIdRaw?.[event.id] ?? 0) > 0;
      if (!isOngoing && !startsTonight && !hasCheckIns) return false;
    }

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
    if (filters.sources.length > 0) {
      const matches = filters.sources.some(src => {
        const opt = SOURCE_OPTIONS.find(o => o.key === src);
        return opt?.prefixes.some(p => event.id.startsWith(p));
      });
      if (!matches) return false;
    }

    if (filterCenter) {
      const dist = getDistance(filterCenter[0], filterCenter[1], event.lat, event.lng);
      if (dist > filters.radiusKm) return false;
    }

    return true;
  }), [allEvents, filters, filterCenter, showLivePulse, liveCountByIdRaw]);
  const displayedMapCenter = mapFocusTarget?.center ?? mapCenter;
  const displayedMapZoom = mapFocusTarget?.zoom ?? mapZoom;

  // Switch to "nearby" mode
  const handleModeChange = useCallback((mode: LocationModeType) => {
    setMapFocusTarget(null);
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

  // Handle France-wide mode
  const handleFranceMode = useCallback(() => {
    setMapFocusTarget(null);
    setLocationMode('france');
    setSelectedCityName(null);
    setFilterCenter(null);
    setMapCenter([46.2276, 2.2137]);
    setMapZoom(6);
    setFilters(prev => ({ ...prev, radiusKm: 9999 }));
  }, []);

  // Handle manual city selection
  const handleCitySelect = useCallback((city: City) => {
    setMapFocusTarget(null);
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
    setMapFocusTarget(null);
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
    setMapFocusTarget(null);
    setSelectedEvent(event);
    setShowDetail(false);
    setMapCenter([event.lat, event.lng]);
    if (activeTab !== 'map') setActiveTab('map');
  }

  // Handle ?city= from URL (SEO pages "Voir sur la carte")
  useEffect(() => {
    if (hasProcessedCity.current) return;
    const cityParam = searchParams.get('city');
    if (cityParam) {
      const city = CITIES.find(c => c.name.toLowerCase() === cityParam.toLowerCase());
      if (city) {
        hasProcessedCity.current = true;
        handleCitySelect(city);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, handleCitySelect, setSearchParams]);

  // Handle ?event= from URL (SEO event page "Voir sur la carte")
  useEffect(() => {
    if (hasProcessedEvent.current) return;
    const eventParam = searchParams.get('event');
    if (eventParam && allEvents.length > 0) {
      const ev = allEvents.find(e => e.id === eventParam);
      if (ev) {
        hasProcessedEvent.current = true;
        loadIdRef.current += 1;
        setSelectedEvent(null);
        setShowDetail(false);
        setLocationMode('france');
        setSelectedCityName(null);
        // Ensure the targeted event is not filtered out by the city radius
        setFilterCenter([ev.lat, ev.lng]);
        setLoadedKey(null);
        setFilters((prev) => ({ ...prev, radiusKm: Math.max(prev.radiusKm, 50) }));
        setMapFocusTarget({ center: [ev.lat, ev.lng], zoom: 16 });
        setMapCenter([ev.lat, ev.lng]);
        setMapZoom(16);
        if (activeTab !== 'map') setActiveTab('map');
        setSearchParams({}, { replace: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEvents]);

  // Single place that translates an onboarding (city, tags) choice into app
  // state — used both by the first-run flow and by re-editing from the profile.
  const handleOnboardingComplete = useCallback((city: City | null, tags: InterestTag[]) => {
    if (city) {
      setPreferredCity(city.name);
      setSelectedCityName(city.name);
      setLocationMode('city');
      setFilterCenter([city.lat, city.lng]);
      setMapCenter([city.lat, city.lng]);
      setMapZoom(DEFAULT_ZOOM);
    }
    setOnboardingTags(tags);
    setFilters((prev) => ({
      ...prev,
      ...(city ? { radiusKm: CITY_RADIUS_DEFAULT } : {}),
      ...tagsToFilterPatch(tags),
    }));
    completeOnboarding();
  }, [setPreferredCity, setOnboardingTags, completeOnboarding]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'var(--map-bg)' }}>
      <SEO
        title="Où sortir ce soir ? Carte des soirées & concerts | PulseMap"
        description="Où sortir ce soir près de chez toi ? PulseMap affiche en direct toutes les soirées, concerts, festivals et bars animés sur une carte interactive. Gratuit, partout en France."
        canonical="/"
        jsonLd={[organizationLd(), websiteLd()]}
      />
      <h1 className="sr-only">Où sortir ce soir ? PulseMap — sorties, concerts & événements en direct près de chez vous</h1>
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      {showEditPreferences && (
        <OnboardingFlow
          mode="edit"
          initialCity={savedCity}
          initialTags={onboardingTags}
          onComplete={(city, tags) => {
            handleOnboardingComplete(city, tags);
            setShowEditPreferences(false);
          }}
        />
      )}
      {/* ── MAP SCREEN (always mounted, hidden via visibility) ── */}
      <div className="absolute inset-0" style={{ visibility: activeTab === 'map' ? 'visible' : 'hidden' }}>
        {/* Map */}
        <div className="absolute inset-0 bottom-16">
          <EventMap
            events={filteredEvents}
            center={displayedMapCenter}
            zoom={displayedMapZoom}
            onEventSelect={setSelectedEvent}
            selectedEvent={selectedEvent}
            userLocation={userLocation}
            radiusKm={filters.radiusKm}
            livePulseMap={livePulseMap}
            liveMode={showLivePulse}
            safePlaces={safePlaces}
            showSafePlaces={showSafePlaces} />
          {/* Cinematic LIVE overlay */}
          {showLivePulse && (
            <>
              <div className="live-mode-overlay" />
              <div className="live-mode-vignette" />
              <div className="live-mode-scan" />
            </>
          )}
        </div>

        {/* Hotspots banner (top of map, scrollable) */}
        <TonightsHotspotsBanner
          allEvents={allEvents}
          onSelect={handleEventSelect}
          visible={!selectedEvent && !showDetail && !showLivePulse}
        />

        {/* LIVE TICKER — only in LIVE mode, replaces the hotspots banner */}
        {showLivePulse && !selectedEvent && !showDetail && (
          <LiveTicker
            liveEvents={liveEvents}
            allEvents={allEvents}
            onSelect={handleEventSelect}
          />
        )}

        {/* ── Top Controls ── */}
        <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none"
          style={{ background: 'var(--top-gradient)' }}>
          <div className="px-3 pt-10 pb-2 pointer-events-auto">
            {/* Row 1: Location mode selector (full width on mobile) */}
            <div className="w-full">
              <LocationMode
                mode={locationMode}
                selectedCity={selectedCityName}
                onModeChange={handleModeChange}
                onCitySelect={handleCitySelect}
                locating={locating}
                onFranceMode={handleFranceMode} />
            </div>
            {/* Row 2: Notification + Filter buttons horizontally, above locate */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowNotifications(true)}
                aria-label="Ouvrir les notifications"
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
                aria-label="Ouvrir les filtres"
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
              <button
                onClick={() => {
                  // Subtle haptic on activation (mobile only, silently ignored elsewhere)
                  try { (navigator as any).vibrate?.(showLivePulse ? 8 : [12, 30, 18]); } catch {}
                  setShowLivePulse(v => {
                    const next = !v;
                    if (next) {
                      toast.success('🔴 LIVE MODE activé', {
                        description: 'Ce qui se passe autour de toi en ce moment.',
                      });
                    } else {
                      toast('Mode normal', { description: 'Tous les évènements à venir.' });
                    }
                    return next;
                  });
                }}
                aria-label={showLivePulse ? 'Quitter le mode Live' : 'Activer le mode Live'}
                className={`h-10 pl-2.5 pr-3.5 rounded-full flex items-center gap-2 shrink-0 transition-all active:scale-95 relative overflow-hidden ${showLivePulse ? 'live-button-breath' : ''}`}
                style={{
                  background: showLivePulse
                    ? 'linear-gradient(135deg, hsl(0 95% 52%), hsl(325 95% 54%) 60%, hsl(285 90% 58%))'
                    : 'var(--controls-bg)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: showLivePulse ? '1.5px solid hsl(0 95% 65% / 0.9)' : '1.5px solid hsl(0 95% 55% / 0.4)',
                  boxShadow: showLivePulse
                    ? '0 0 0 3px hsl(0 95% 55% / 0.25), 0 0 22px hsl(325 95% 54% / 0.5), 0 8px 32px hsl(0 95% 55% / 0.6)'
                    : '0 4px 14px hsl(0 95% 55% / 0.18), var(--controls-shadow)',
                  color: showLivePulse ? 'white' : 'hsl(0 85% 48%)',
                }}
              >
                {/* Live broadcast dot OR flame when active */}
                {showLivePulse ? (
                  <Flame size={13} className="flame-flicker shrink-0" style={{ color: 'hsl(45 100% 70%)' }} />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full relative shrink-0"
                    style={{ background: 'hsl(0 95% 55%)', boxShadow: '0 0 10px hsl(0 95% 55%)' }}
                  >
                    <span
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: 'hsl(0 95% 55%)', opacity: 0.7 }}
                    />
                  </span>
                )}
                <span className="text-[11px] font-extrabold tracking-[0.08em] uppercase leading-none">
                  {showLivePulse
                    ? (liveEvents.length > 0 ? `${liveEvents.length} LIVE NOW` : 'HOT TONIGHT')
                    : 'Live'}
                </span>
              </button>
              <button
                onClick={() => {
                  const next = !showSafePlaces;
                  setShowSafePlaces(next);
                  if (next && displayedMapZoom < 10) {
                    toast.info('Zoome sur une ville pour voir les lieux sûrs', { duration: 3000 });
                  }
                }}

                aria-label={showSafePlaces ? 'Masquer les safeplaces' : 'Afficher les safeplaces'}
                className="h-10 pl-2.5 pr-3.5 rounded-full flex items-center gap-2 shrink-0 transition-all active:scale-95"
                style={{
                  background: showSafePlaces
                    ? 'linear-gradient(135deg, hsl(142 60% 35%), hsl(160 55% 42%))'
                    : 'var(--controls-bg)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: showSafePlaces
                    ? '1.5px solid hsl(142 60% 55% / 0.9)'
                    : '1.5px solid hsl(142 60% 45% / 0.35)',
                  boxShadow: showSafePlaces
                    ? '0 0 0 3px hsl(142 60% 40% / 0.2), 0 0 18px hsl(142 60% 40% / 0.45)'
                    : '0 4px 14px hsl(142 60% 40% / 0.12), var(--controls-shadow)',
                  color: showSafePlaces ? 'white' : 'hsl(142 55% 42%)',
                }}
              >
                <img
                  src={safeShieldLogo}
                  alt=""
                  width={18}
                  height={18}
                  className={`shrink-0 transition-all duration-500 ${
                    showSafePlaces
                      ? 'opacity-100 drop-shadow-[0_0_8px_hsl(142_80%_55%/0.9)] animate-[live-breath_2.4s_ease-in-out_infinite]'
                      : 'opacity-55 grayscale'
                  }`}
                  style={{ filter: showSafePlaces ? 'brightness(1.15)' : undefined }}
                />
                <span className="text-[11px] font-extrabold tracking-[0.08em] uppercase leading-none">
                  Safe
                </span>
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
          aria-label="Me localiser sur la carte"
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
            coLocatedEvents={filteredEvents.filter(e => {
              const THRESHOLD = 0.0005; // ~50m
              return Math.abs(e.lat - selectedEvent.lat) < THRESHOLD && Math.abs(e.lng - selectedEvent.lng) < THRESHOLD;
            })}
            onEventChange={(ev) => setSelectedEvent(ev)}
            liveMode={showLivePulse}
            liveCount={liveCountByIdRaw?.[selectedEvent.id] ?? 0}
          />
        )}

        {/* Full event detail page */}
        {selectedEvent && showDetail && (
          <EventDetailPage
            event={selectedEvent}
            onClose={() => setShowDetail(false)}
            userLocation={userLocation}
            attendance={attendance}
            favorites={favorites}
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
      <ProfileScreen
        preferredCityObj={savedCity}
        onboardingTags={onboardingTags}
        onEditPreferences={() => setShowEditPreferences(true)}
      />
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
          aria-label="Ajouter un événement"
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

      {/* ── LEGAL FOOTER (above BottomNav, only on map tab to keep immersion) ── */}
      {activeTab === 'map' && !selectedEvent && <LegalFooter />}


      {/* ── BOTTOM NAV ── */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => {setActiveTab(tab);setSelectedEvent(null);}} />
    </div>);
}
