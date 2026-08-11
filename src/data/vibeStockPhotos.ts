import { EventVibe } from './mockEvents';

// Free-license stock photos (Pexels — free for commercial use, no attribution
// required) used as EventCard backgrounds for events with no real image_url.
// Several per vibe so a city's event list doesn't show the same photo on
// every card of the same vibe — EventCard picks one deterministically per
// event id (see pickVibeStockPhoto below), so a given event's photo stays
// stable across reloads.
export const vibeStockPhotos: Record<EventVibe, string[]> = {
  rave: [
    'https://images.pexels.com/photos/5143166/pexels-photo-5143166.jpeg',
    'https://images.pexels.com/photos/26794186/pexels-photo-26794186.jpeg',
    'https://images.pexels.com/photos/16723014/pexels-photo-16723014.jpeg',
    'https://images.pexels.com/photos/27676345/pexels-photo-27676345.jpeg',
  ],
  chill: [
    'https://images.pexels.com/photos/29989818/pexels-photo-29989818.jpeg',
    'https://images.pexels.com/photos/33389199/pexels-photo-33389199.jpeg',
    'https://images.pexels.com/photos/33798945/pexels-photo-33798945.jpeg',
    'https://images.pexels.com/photos/33053204/pexels-photo-33053204.jpeg',
  ],
  afterwork: [
    'https://images.pexels.com/photos/16374127/pexels-photo-16374127.jpeg',
    'https://images.pexels.com/photos/3009786/pexels-photo-3009786.jpeg',
    'https://images.pexels.com/photos/3851580/pexels-photo-3851580.jpeg',
    'https://images.pexels.com/photos/1274595/pexels-photo-1274595.jpeg',
  ],
  cosy: [
    'https://images.pexels.com/photos/29844873/pexels-photo-29844873.jpeg',
    'https://images.pexels.com/photos/30691575/pexels-photo-30691575.jpeg',
    'https://images.pexels.com/photos/5863513/pexels-photo-5863513.jpeg',
    'https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg',
  ],
  concert: [
    'https://images.pexels.com/photos/248963/pexels-photo-248963.jpeg',
    'https://images.pexels.com/photos/13230484/pexels-photo-13230484.jpeg',
    'https://images.pexels.com/photos/38780318/pexels-photo-38780318.jpeg',
    'https://images.pexels.com/photos/31103314/pexels-photo-31103314.jpeg',
  ],
  culture: [
    'https://images.pexels.com/photos/26424632/pexels-photo-26424632.jpeg',
    'https://images.pexels.com/photos/35719467/pexels-photo-35719467.jpeg',
    'https://images.pexels.com/photos/35061825/pexels-photo-35061825.jpeg',
    'https://images.pexels.com/photos/29608796/pexels-photo-29608796.jpeg',
  ],
  sport: [
    'https://images.pexels.com/photos/18408962/pexels-photo-18408962.jpeg',
    'https://images.pexels.com/photos/29840338/pexels-photo-29840338.jpeg',
    'https://images.pexels.com/photos/29400389/pexels-photo-29400389.jpeg',
    'https://images.pexels.com/photos/38675119/pexels-photo-38675119.jpeg',
  ],
  party: [
    'https://images.pexels.com/photos/796606/pexels-photo-796606.jpeg',
    'https://images.pexels.com/photos/5805087/pexels-photo-5805087.jpeg',
    'https://images.pexels.com/photos/12283305/pexels-photo-12283305.jpeg',
    'https://images.pexels.com/photos/30586672/pexels-photo-30586672.jpeg',
  ],
  nightlife: [
    'https://images.pexels.com/photos/16269959/pexels-photo-16269959.jpeg',
    'https://images.pexels.com/photos/30641513/pexels-photo-30641513.jpeg',
    'https://images.pexels.com/photos/18867525/pexels-photo-18867525.jpeg',
    'https://images.pexels.com/photos/37126955/pexels-photo-37126955.jpeg',
  ],
  dance: [
    'https://images.pexels.com/photos/30175752/pexels-photo-30175752.jpeg',
    'https://images.pexels.com/photos/5192307/pexels-photo-5192307.jpeg',
    'https://images.pexels.com/photos/5192299/pexels-photo-5192299.jpeg',
    'https://images.pexels.com/photos/5610120/pexels-photo-5610120.jpeg',
  ],
  family: [
    'https://images.pexels.com/photos/5119595/pexels-photo-5119595.jpeg',
    'https://images.pexels.com/photos/7669127/pexels-photo-7669127.jpeg',
    'https://images.pexels.com/photos/19510865/pexels-photo-19510865.jpeg',
    'https://images.pexels.com/photos/8208324/pexels-photo-8208324.jpeg',
  ],
  energy: [
    'https://images.pexels.com/photos/30433580/pexels-photo-30433580.jpeg',
    'https://images.pexels.com/photos/32399568/pexels-photo-32399568.jpeg',
    'https://images.pexels.com/photos/33715057/pexels-photo-33715057.jpeg',
    'https://images.pexels.com/photos/38780313/pexels-photo-38780313.jpeg',
  ],
};

// Deterministic pick so a given event always shows the same stock photo
// across reloads/re-renders, while different events of the same vibe still
// get visual variety in a city's event list.
export function pickVibeStockPhoto(vibe: EventVibe, eventId: string): string {
  const pool = vibeStockPhotos[vibe];
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = (hash * 31 + eventId.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(hash) % pool.length];
}
