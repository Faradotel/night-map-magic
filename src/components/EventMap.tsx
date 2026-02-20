import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NightEvent, vibeConfig, typeConfig } from '@/data/mockEvents';

interface EventMapProps {
  events: NightEvent[];
  center: [number, number];
  zoom: number;
  onEventSelect: (event: NightEvent) => void;
  selectedEvent: NightEvent | null;
  userLocation: [number, number] | null;
  radiusKm: number;
}

function createEventIcon(event: NightEvent, isSelected: boolean): L.DivIcon {
  const vibe = vibeConfig[event.vibe];
  const typeEmoji = typeConfig[event.type]?.emoji ?? '📍';
  const color = isSelected ? 'hsl(325, 89%, 50%)' : vibe.color;
  const size = isSelected ? 48 : 40;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${event.isLive ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color}22;animation:ping-slow 1.5s ease-out infinite;"></div>` : ''}
        <div style="width:${size - 4}px;height:${size - 4}px;border-radius:50%;background:hsl(230,50%,10%);border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:${isSelected ? 20 : 17}px;box-shadow:0 0 ${isSelected ? 20 : 12}px ${color}66,0 2px 8px rgba(0,0,0,.6);cursor:pointer;position:relative;z-index:1;">${typeEmoji}</div>
        ${event.isLive ? `<div style="position:absolute;top:0;right:0;width:10px;height:10px;border-radius:50%;background:hsl(325,89%,50%);border:2px solid hsl(230,55%,7%);z-index:2;"></div>` : ''}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;inset:0;border-radius:50%;background:hsl(325,89%,50%,0.2);animation:ping-slow 2s ease-out infinite;"></div><div style="width:24px;height:24px;border-radius:50%;background:hsl(325,89%,50%);border:3px solid white;box-shadow:0 0 16px hsl(325,89%,50%,0.8);"></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function EventMap({ events, center, zoom, onEventSelect, selectedEvent, userLocation, radiusKm }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Event markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current.clear();

    events.forEach(event => {
      const isSelected = selectedEvent?.id === event.id;
      const marker = L.marker([event.lat, event.lng], {
        icon: createEventIcon(event, isSelected),
        zIndexOffset: isSelected ? 500 : 0,
      }).addTo(map);
      marker.on('click', () => onEventSelect(event));
      markersRef.current.set(event.id, marker);
    });
  }, [events, selectedEvent, onEventSelect]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
