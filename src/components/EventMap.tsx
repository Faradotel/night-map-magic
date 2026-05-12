import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { NightEvent, vibeConfig, typeConfig } from '@/data/mockEvents';
import { useTheme } from '@/hooks/useTheme';
import { getSourceEmoji } from '@/lib/sourceEmoji';

interface EventMapProps {
  events: NightEvent[];
  center: [number, number];
  zoom: number;
  onEventSelect: (event: NightEvent) => void;
  selectedEvent: NightEvent | null;
  userLocation: [number, number] | null;
  radiusKm: number;
  /** Map event_id → nombre de check-ins récents. Active l'animation Live Pulse. */
  livePulseMap?: Record<string, number>;
}

function createEventIcon(
  event: NightEvent,
  isSelected: boolean,
  isDark: boolean,
  liveCount: number = 0,
  stackCount: number = 1,
): L.DivIcon {
  const vibe = vibeConfig[event.vibe];
  const typeEmoji = getSourceEmoji(event.id, typeConfig[event.type]?.emoji ?? '📍', event.type);
  const color = vibe.color;
  // +15% larger markers for stronger map presence
  const size = isSelected ? 60 : 48;
  const bg = isDark ? 'rgba(26,13,21,0.85)' : 'rgba(255,255,255,0.96)';
  const liveDotBorder = isDark ? 'rgba(26,13,21,0.9)' : 'rgba(255,255,255,0.95)';
  const pulse = liveCount > 0;
  const pulseColor = 'hsl(142,71%,45%)';
  const stackAccent = 'hsl(325,95%,54%)';
  const showStack = stackCount > 1;
  // Stronger glow in light mode so neon identity survives daylight
  const glowAlpha = isDark ? '55' : '88';
  const glowAlpha2 = isDark ? '22' : '44';
  const dropShadow = isDark ? '0 4px 12px rgba(0,0,0,.5)' : '0 6px 16px rgba(40,10,60,.18), 0 2px 4px rgba(40,10,60,.12)';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulse ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${pulseColor};animation:ping-slow 1.8s ease-out infinite;opacity:0.55;pointer-events:none;"></div>` : ''}
        ${pulse ? `<div style="position:absolute;inset:-2px;border-radius:50%;background:${pulseColor}22;animation:ping-slow 1.8s ease-out infinite;pointer-events:none;"></div>` : ''}
        ${!pulse && !isSelected ? `<div style="position:absolute;inset:-3px;border-radius:50%;background:radial-gradient(circle, ${color}${glowAlpha2} 0%, transparent 70%);pointer-events:none;"></div>` : ''}
        ${isSelected && !pulse ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};animation:ping-slow 1.5s ease-out infinite;opacity:0.4;pointer-events:none;"></div>` : ''}
        ${isSelected && event.isLive ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color}22;animation:ping-slow 1.5s ease-out infinite;pointer-events:none;"></div>` : ''}
        <div style="width:${size - 6}px;height:${size - 6}px;border-radius:50%;background:${bg};backdrop-filter:blur(8px);border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:${isSelected ? 24 : 20}px;box-shadow:0 0 ${isSelected ? 28 : 18}px ${color}${glowAlpha}, 0 0 ${isSelected ? 48 : 32}px ${color}${glowAlpha2}, ${dropShadow};cursor:pointer;position:relative;z-index:1;">${typeEmoji}</div>
        ${showStack ? `<div style="position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:${stackAccent};color:white;font-size:11px;font-weight:800;line-height:22px;text-align:center;box-shadow:0 0 12px ${stackAccent}aa,0 2px 6px rgba(0,0,0,0.25);border:2px solid ${liveDotBorder};z-index:4;white-space:nowrap;">${stackCount}</div>` : ''}
        ${pulse ? `<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);padding:1px 6px;border-radius:999px;background:${pulseColor};color:white;font-size:9px;font-weight:800;line-height:1.3;box-shadow:0 2px 6px ${pulseColor}55;border:1.5px solid ${liveDotBorder};z-index:3;white-space:nowrap;">+${liveCount}</div>` : ''}
        ${event.isLive && !pulse && !showStack ? `<div style="position:absolute;top:0;right:0;width:11px;height:11px;border-radius:50%;background:hsl(142,71%,45%);border:2px solid ${liveDotBorder};z-index:2;box-shadow:0 0 10px hsl(142,71%,45%,0.7);pointer-events:none;"></div>` : ''}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;inset:-4px;border-radius:50%;background:hsl(325,89%,50%,0.15);animation:ping-slow 2.5s ease-out infinite;"></div><div style="position:absolute;inset:-1px;border-radius:50%;background:hsl(325,89%,50%,0.08);"></div><div style="width:14px;height:14px;border-radius:50%;background:hsl(325,89%,50%);border:2px solid white;box-shadow:0 0 10px hsl(325,89%,50%,0.6);"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function EventMap({ events, center, zoom, onEventSelect, selectedEvent, userLocation, radiusKm, livePulseMap }: EventMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const prevSelectedRef = useRef<string | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const stackCountsRef = useRef<Map<string, number>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png?language=fr'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?language=fr';

    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap tile layer on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png?language=fr'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?language=fr';
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
  }, [theme]);

  // Update center/zoom
  useEffect(() => {
    mapRef.current?.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  // User location marker + radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
    if (radiusCircleRef.current) { map.removeLayer(radiusCircleRef.current); radiusCircleRef.current = null; }

    if (userLocation) {
      userMarkerRef.current = L.marker(userLocation, { icon: createUserIcon(), zIndexOffset: 1000 }).addTo(map);
      radiusCircleRef.current = L.circle(userLocation, {
        radius: radiusKm * 1000,
        color: 'hsl(325, 89%, 50%)',
        fillColor: 'hsl(325, 89%, 50%)',
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '6 4',
      }).addTo(map);
    }
  }, [userLocation, radiusKm]);

  // Event markers – clustered
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current.clear();

    // Count events co-located within ~50m (0.0005°). Direct neighbour scan to
    // avoid bucket-boundary artefacts where two close events fall in adjacent cells.
    const stackCounts = new Map<string, number>();
    const THRESHOLD = 0.0005;
    for (const e of events) {
      let count = 0;
      for (const other of events) {
        if (Math.abs(e.lat - other.lat) <= THRESHOLD && Math.abs(e.lng - other.lng) <= THRESHOLD) {
          count++;
        }
      }
      stackCounts.set(e.id, count);
    }
    stackCountsRef.current = stackCounts;

    const isFranceZoom = (mapRef.current?.getZoom() ?? zoom) <= 8;
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: isFranceZoom ? 60 : 30,
      disableClusteringAtZoom: 14,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count > 20 ? 52 : count > 5 ? 44 : 38;
        return L.divIcon({
          className: '',
          html: `<div style="position:relative;width:${size}px;height:${size}px;">
            <div style="position:absolute;inset:-4px;border-radius:50%;background:radial-gradient(circle, hsl(325,95%,54%,0.35) 0%, transparent 70%);animation:ping-slow 2.4s ease-out infinite;pointer-events:none;"></div>
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,hsl(325,95%,54%),hsl(285,80%,58%));display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:${count > 20 ? 15 : 13}px;box-shadow:0 0 22px hsl(325,95%,54%,0.55),0 0 44px hsl(325,95%,54%,0.25),0 4px 12px rgba(40,10,60,0.25);border:2px solid rgba(255,255,255,0.85);">${count}</div>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    events.forEach(event => {
      const liveCount = livePulseMap?.[event.id] ?? 0;
      const stack = stackCounts.get(event.id) ?? 1;
      const marker = L.marker([event.lat, event.lng], {
        icon: createEventIcon(event, false, isDark, liveCount, stack),
        zIndexOffset: liveCount > 0 ? 250 : (stack > 1 ? 100 : 0),
      });
      marker.on('click', () => onEventSelect(event));
      markersRef.current.set(event.id, marker);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
  }, [events, onEventSelect, isDark, livePulseMap]);

  // Selection highlight – only update the 2 affected markers
  useEffect(() => {
    const prevId = prevSelectedRef.current;
    const newId = selectedEvent?.id ?? null;

    if (prevId === newId) return;

    // Deselect previous
    if (prevId) {
      const prevMarker = markersRef.current.get(prevId);
      const prevEvent = events.find(e => e.id === prevId);
      if (prevMarker && prevEvent) {
        const stack = stackCountsRef.current.get(prevId) ?? 1;
        prevMarker.setIcon(createEventIcon(prevEvent, false, isDark, livePulseMap?.[prevId] ?? 0, stack));
        prevMarker.setZIndexOffset((livePulseMap?.[prevId] ?? 0) > 0 ? 250 : (stack > 1 ? 100 : 0));
      }
    }

    // Select new
    if (newId && selectedEvent) {
      const newMarker = markersRef.current.get(newId);
      if (newMarker) {
        const stack = stackCountsRef.current.get(newId) ?? 1;
        newMarker.setIcon(createEventIcon(selectedEvent, true, isDark, livePulseMap?.[newId] ?? 0, stack));
        newMarker.setZIndexOffset(500);
      }
    }

    prevSelectedRef.current = newId;
  }, [selectedEvent, events]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
