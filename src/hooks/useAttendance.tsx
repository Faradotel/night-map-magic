import { useState, useCallback } from 'react';

export interface AttendedEvent {
  id: string;
  name: string;
  city: string;
  date: string; // ISO string
}

const STORAGE_KEY = 'nightmap_attended';

function loadAttended(): AttendedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAttended(events: AttendedEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useAttendance() {
  const [attended, setAttended] = useState<AttendedEvent[]>(loadAttended);

  const toggleAttendance = useCallback((event: AttendedEvent) => {
    setAttended(prev => {
      const exists = prev.some(e => e.id === event.id);
      const next = exists ? prev.filter(e => e.id !== event.id) : [...prev, event];
      saveAttended(next);
      return next;
    });
  }, []);

  const isAttended = useCallback((id: string) => {
    return attended.some(e => e.id === id);
  }, [attended]);

  const stats = {
    totalEvents: attended.length,
    uniqueCities: new Set(attended.map(e => e.city)).size,
  };

  return { attended, toggleAttendance, isAttended, stats };
}
