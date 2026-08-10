import { useState, useCallback } from 'react';
import { advancedGenreMap, categoryToVibes, categoryToSources, Filters } from '@/components/FilterBar';

const PREFS_STORAGE_KEY = 'pulsemap_onboarding_prefs_v1';
const DONE_STORAGE_KEY = 'pulse_onboarding_done_v3';

export type InterestTag = 'techno' | 'house' | 'hiphop' | 'rock' | 'concerts' | 'bars' | 'festivals';

export const INTEREST_TAG_OPTIONS: { key: InterestTag; label: string; emoji: string }[] = [
  { key: 'techno', label: 'Techno', emoji: '🎛️' },
  { key: 'house', label: 'House', emoji: '🎧' },
  { key: 'hiphop', label: 'Hip-hop', emoji: '🎤' },
  { key: 'rock', label: 'Rock', emoji: '🎸' },
  { key: 'concerts', label: 'Concerts', emoji: '🎵' },
  { key: 'bars', label: 'Bars', emoji: '🍹' },
  { key: 'festivals', label: 'Festivals', emoji: '🎪' },
];

// Union/dedupe each tag's genre/vibe/source contribution into a Filters patch,
// reusing the same maps the manual filter panel uses (single source of truth).
export function tagsToFilterPatch(tags: InterestTag[]): Pick<Filters, 'genres' | 'vibes' | 'sources'> {
  const genres = new Set<Filters['genres'][number]>();
  const vibes = new Set<Filters['vibes'][number]>();
  const sources = new Set<Filters['sources'][number]>();

  for (const tag of tags) {
    switch (tag) {
      case 'techno':
        genres.add('techno');
        break;
      case 'house':
        genres.add('house');
        break;
      case 'hiphop':
        advancedGenreMap.hiphop.forEach((g) => genres.add(g));
        break;
      case 'rock':
        advancedGenreMap.rock.forEach((g) => genres.add(g));
        break;
      case 'concerts':
        categoryToVibes.concert.forEach((v) => vibes.add(v));
        categoryToSources.concert.forEach((s) => sources.add(s));
        break;
      case 'festivals':
        categoryToSources.festival.forEach((s) => sources.add(s));
        break;
      case 'bars':
        categoryToVibes.afterwork.forEach((v) => vibes.add(v));
        break;
    }
  }

  return { genres: [...genres], vibes: [...vibes], sources: [...sources] };
}

function readTags(): InterestTag[] {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.tags) ? parsed.tags : [];
  } catch {
    return [];
  }
}

export function useOnboardingPreferences() {
  const [tags, setTagsState] = useState<InterestTag[]>(() => readTags());

  const setTags = useCallback((next: InterestTag[]) => {
    setTagsState(next);
    try { localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ tags: next })); } catch {}
  }, []);

  return { tags, setTags };
}

export function useShouldShowOnboarding() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(DONE_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const complete = useCallback(() => {
    try { localStorage.setItem(DONE_STORAGE_KEY, '1'); } catch {}
    setShow(false);
  }, []);

  return { show, complete };
}
