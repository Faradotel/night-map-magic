import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { NightEvent, vibeConfig, typeConfig } from '@/data/mockEvents';
import { useTheme } from '@/hooks/useTheme';
import { getSourceEmoji } from '@/lib/sourceEmoji';
import { SafePlace } from '@/hooks/useSafePlaces';
import { useAnalytics } from '@/hooks/useAnalytics';

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
  /** Mode LIVE immersif : tous les markers gagnent un halo + glow renforcé. */
  liveMode?: boolean;
  safePlaces?: SafePlace[];
  showSafePlaces?: boolean;
}

function createEventIcon(
  event: NightEvent,
  isSelected: boolean,
  isDark: boolean,
  liveCount: number = 0,
  stackCount: number = 1,
  liveMode: boolean = false,
): L.DivIcon {
  const vibe = vibeConfig[event.vibe];
  const typeEmoji = getSourceEmoji(event.id, typeConfig[event.type]?.emoji ?? '📍', event.type);
  const color = vibe.color;
  // +15% larger markers for stronger map presence; +6px in LIVE mode
  const baseSize = isSelected ? 60 : 48;
  const size = liveMode ? baseSize + 6 : baseSize;
  const bg = isDark ? 'rgba(26,13,21,0.85)' : 'rgba(255,255,255,0.96)';
  const liveDotBorder = isDark ? 'rgba(26,13,21,0.9)' : 'rgba(255,255,255,0.95)';
  const pulse = liveCount > 0;
  const pulseColor = 'hsl(142,71%,45%)';
  const stackAccent = 'hsl(325,95%,54%)';
  const showStack = stackCount > 1;
  // Stronger glow in light mode so neon identity survives daylight; even stronger in LIVE
  const glowAlpha = liveMode ? 'cc' : (isDark ? '55' : '88');
  const glowAlpha2 = liveMode ? '66' : (isDark ? '22' : '44');
  const dropShadow = isDark ? '0 4px 12px rgba(0,0,0,.5)' : '0 6px 16px rgba(40,10,60,.18), 0 2px 4px rgba(40,10,60,.12)';
  // LIVE mode: soft breathing halo on every marker (CSS keyframes in index.css)
  const liveHalo = liveMode && !pulse
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;background:radial-gradient(circle, ${color}55 0%, transparent 65%);animation:live-breath 2.4s ease-in-out infinite;pointer-events:none;"></div>`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${liveHalo}
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

const SAFE_PLACE_CONFIG: Record<SafePlace['type'], { color: string; emoji: string; label: string }> = {
  tabac:    { color: 'hsl(25,70%,45%)',  emoji: '🪧', label: 'Bureau de tabac' },
  pharmacy: { color: 'hsl(142,60%,40%)', emoji: '⚕️', label: 'Pharmacie' },
  police:   { color: 'hsl(220,80%,50%)', emoji: '🚔', label: 'Police / Gendarmerie' },
  bar:      { color: 'hsl(45,90%,48%)',  emoji: '🤝', label: 'Bar partenaire' },
};

function createSafePlaceIcon(type: SafePlace['type'], isDark: boolean): L.DivIcon {
  const cfg = SAFE_PLACE_CONFIG[type];
  const size = 38;
  const bg = isDark ? 'rgba(16,20,28,0.9)' : 'rgba(255,255,255,0.97)';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:-3px;border-radius:50%;background:radial-gradient(circle,${cfg.color}44 0%,transparent 70%);pointer-events:none;"></div>
      <div style="width:${size - 4}px;height:${size - 4}px;border-radius:50%;background:${bg};backdrop-filter:blur(6px);border:2px solid ${cfg.color};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px ${cfg.color}66,0 2px 8px rgba(0,0,0,.35);cursor:pointer;">${cfg.emoji}</div>
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

export function EventMap({ events, center, zoom, onEventSelect, selectedEvent, userLocation, radiusKm, livePulseMap, liveMode, safePlaces, showSafePlaces }: EventMapProps) {
  const { trackEvent } = useAnalytics();
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
  const safePlaceLayerRef = useRef<L.LayerGroup | null>(null);
  // Tracks whether the current move/zoom was started by a human gesture (drag/tap)
  // rather than a programmatic setView/panTo (e.g. recentring after onboarding or
  // a city change) — only the former should count as a map_interaction event.
  const userIsInteractingRef = useRef(false);

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

    map.on('mousedown', () => { userIsInteractingRef.current = true; });
    map.on('touchstart', () => { userIsInteractingRef.current = true; });
    map.on('zoomend', () => {
      if (userIsInteractingRef.current) trackEvent('map_interaction', { interaction_type: 'zoom' });
    });
    map.on('moveend', () => {
      if (userIsInteractingRef.current) trackEvent('map_interaction', { interaction_type: 'pan' });
      setTimeout(() => { userIsInteractingRef.current = false; }, 0);
    });

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

  // Update center/zoom — preserve user's manual zoom when only center changes.
  // We track the last props applied; if the zoom prop is unchanged, we just panTo
  // so pinching/scrolling on the map isn't reset on the next center update.
  const lastAppliedRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const last = lastAppliedRef.current;
    const zoomChanged = !last || last.zoom !== zoom;
    const centerChanged = !last || last.center[0] !== center[0] || last.center[1] !== center[1];
    if (zoomChanged) {
      map.setView(center, zoom, { animate: true });
    } else if (centerChanged) {
      map.panTo(center, { animate: true });
    }
    lastAppliedRef.current = { center, zoom };
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

  // Map every event id → its group "leader" id (the representative marker on map).
  // Co-located events (≤ ~50m) share a single bubble with a stacked badge.
  const leaderByIdRef = useRef<Map<string, string>>(new Map());

  // Event markers – clustered, with co-location deduplication
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current.clear();

    // ── Build proximity groups (≤ ~50m). One marker per group. ──
    const THRESHOLD = 0.0005; // ≈ 50m
    const leaderById = new Map<string, string>(); // eventId → leaderId
    const groupByLeader = new Map<string, NightEvent[]>(); // leaderId → events
    for (const e of events) {
      if (leaderById.has(e.id)) continue;
      // This event becomes a new leader; collect every still-unassigned neighbour.
      const members: NightEvent[] = [e];
      leaderById.set(e.id, e.id);
      for (const other of events) {
        if (other.id === e.id || leaderById.has(other.id)) continue;
        if (Math.abs(e.lat - other.lat) <= THRESHOLD && Math.abs(e.lng - other.lng) <= THRESHOLD) {
          leaderById.set(other.id, e.id);
          members.push(other);
        }
      }
      groupByLeader.set(e.id, members);
    }
    leaderByIdRef.current = leaderById;
    // Stack count = size of group (for the leader; neighbours share the leader marker)
    const stackCounts = new Map<string, number>();
    for (const [leaderId, members] of groupByLeader) {
      stackCounts.set(leaderId, members.length);
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

    // One marker per group, anchored on the leader's lat/lng.
    for (const [leaderId, members] of groupByLeader) {
      const leader = members[0];
      const liveCount = livePulseMap?.[leaderId] ?? 0;
      const stack = members.length;
      const marker = L.marker([leader.lat, leader.lng], {
        icon: createEventIcon(leader, false, isDark, liveCount, stack, !!liveMode),
        zIndexOffset: liveCount > 0 ? 250 : (stack > 1 ? 100 : 0),
      });
      marker.on('click', () => onEventSelect(leader));
      markersRef.current.set(leaderId, marker);
      clusterGroup.addLayer(marker);
    }

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
  }, [events, onEventSelect, isDark, livePulseMap, liveMode]);

  // Selection highlight – only update the 2 affected markers
  useEffect(() => {
    const prevId = prevSelectedRef.current;
    const newId = selectedEvent?.id ?? null;

    if (prevId === newId) return;

    // Resolve each id to its group leader (the actual marker owner)
    const prevLeader = prevId ? leaderByIdRef.current.get(prevId) ?? prevId : null;
    const newLeader = newId ? leaderByIdRef.current.get(newId) ?? newId : null;

    // Deselect previous (only if not the same marker as the new one)
    if (prevLeader && prevLeader !== newLeader) {
      const prevMarker = markersRef.current.get(prevLeader);
      const prevEvent = events.find(e => e.id === prevLeader);
      if (prevMarker && prevEvent) {
        const stack = stackCountsRef.current.get(prevLeader) ?? 1;
        prevMarker.setIcon(createEventIcon(prevEvent, false, isDark, livePulseMap?.[prevLeader] ?? 0, stack, !!liveMode));
        prevMarker.setZIndexOffset((livePulseMap?.[prevLeader] ?? 0) > 0 ? 250 : (stack > 1 ? 100 : 0));
      }
    }

    // Select new (highlight the leader marker, but show the selected event's vibe colour)
    if (newLeader && selectedEvent) {
      const newMarker = markersRef.current.get(newLeader);
      if (newMarker) {
        const stack = stackCountsRef.current.get(newLeader) ?? 1;
        newMarker.setIcon(createEventIcon(selectedEvent, true, isDark, livePulseMap?.[newLeader] ?? 0, stack, !!liveMode));
        newMarker.setZIndexOffset(500);
      }
    }

    prevSelectedRef.current = newId;
  }, [selectedEvent, events]);

  // Safeplace markers — separate layer, viewport-filtered for perf (50k+ points).
  // Re-renders on map move/zoom; capped at 400 visible markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const escape = (s: string) =>
      s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

    const renderLayer = () => {
      if (safePlaceLayerRef.current) {
        map.removeLayer(safePlaceLayerRef.current);
        safePlaceLayerRef.current = null;
      }
      if (!showSafePlaces || !safePlaces?.length) return;

      // On affiche les safeplaces visibles à l'écran dès qu'on est assez zoomé.

      // (Pas de filtre par rayon utilisateur : on suit ce que l'utilisateur regarde.)
      if (map.getZoom() < 10) return;

      const bounds = map.getBounds().pad(0.1);
      const layer = L.layerGroup();
      let count = 0;
      const MAX = 400;
      for (const place of safePlaces) {
        if (!bounds.contains([place.lat, place.lng])) continue;

        const cfg = SAFE_PLACE_CONFIG[place.type];
        const marker = L.marker([place.lat, place.lng], {
          icon: createSafePlaceIcon(place.type, isDark),
          zIndexOffset: -100,
        });
        const telDigits = place.phone ? place.phone.replace(/[^\d+]/g, '') : '';
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
        const cardBg = isDark ? 'rgba(20,14,24,0.96)' : 'rgba(255,255,255,0.98)';
        const textColor = isDark ? '#f5eef2' : '#1a1020';
        const subColor = isDark ? 'rgba(245,238,242,0.65)' : 'rgba(26,16,32,0.6)';
        const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,14,24,0.08)';
        const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,14,24,0.06)';
        const popupHtml = `
          <div style="min-width:230px;max-width:270px;font-family:'Plus Jakarta Sans',sans-serif;background:${cardBg};color:${textColor};border:1px solid ${borderColor};border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.32),0 2px 8px rgba(0,0,0,.18);overflow:hidden;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);">
            <div style="padding:12px 14px 10px 14px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:${cfg.color}22;font-size:14px;line-height:1;">${cfg.emoji}</span>
                <span style="font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${cfg.color};">${cfg.label}</span>
              </div>
              <div style="font-weight:700;font-size:14px;line-height:1.3;margin-bottom:${place.address ? '6px' : '0'};">${escape(place.name)}</div>
              ${place.address ? `<div style="font-size:12px;line-height:1.4;color:${subColor};">${escape(place.address)}</div>` : ''}
              ${place.hours ? `<div style="font-size:11px;line-height:1.35;color:${subColor};margin-top:6px;display:flex;gap:5px;"><span>🕒</span><span>${escape(place.hours)}</span></div>` : ''}
            </div>
            <div style="display:flex;gap:0;border-top:1px solid ${dividerColor};">
              ${place.phone ? `<a href="tel:${telDigits}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 8px;font-size:12px;font-weight:700;color:${cfg.color};text-decoration:none;">📞 Appeler</a>` : ''}
              ${place.phone ? `<div style="width:1px;background:${dividerColor};"></div>` : ''}
              <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 8px;font-size:12px;font-weight:700;color:${textColor};text-decoration:none;">🧭 Itinéraire</a>
            </div>
          </div>`;
        marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10], maxWidth: 280, className: 'safeplace-popup' });
        layer.addLayer(marker);
        if (++count >= MAX) break;
      }
      layer.addTo(map);
      safePlaceLayerRef.current = layer;
    };

    renderLayer();
    if (!showSafePlaces) return;
    map.on('moveend', renderLayer);
    return () => { map.off('moveend', renderLayer); };
  }, [safePlaces, showSafePlaces, isDark, userLocation, radiusKm]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
