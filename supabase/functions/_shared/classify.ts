// Mapping Ticketmaster → schéma Pulse (type / genre / subGenre / vibe / priority).
// Voir Option C dans le refactor: on garde 100% des events mais on les classe
// proprement pour que Nightlife/Concert/Festival ressortent devant Spectacle/
// Culture/Famille sur la carte.

export interface ClassifiedEvent {
  type: string;
  vibe: string;
  genres: string[];
  subGenre: string | null;
  priority: number;
}

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Normalisation FR → slug court pour matcher les filtres de l'app.
const GENRE_NORMALIZE: Record<string, string> = {
  'danse/electronique': 'electro',
  'danse electronique': 'electro',
  'electronique': 'electro',
  'hip-hop/rap': 'hip-hop',
  'hip hop/rap': 'hip-hop',
  'rap': 'hip-hop',
  'chanson francaise': 'chanson',
  'chanson française': 'chanson',
  'metal': 'metal',
  'rock': 'rock',
  'pop': 'pop',
  'jazz': 'jazz',
  'reggae': 'reggae',
  'classique': 'classique',
  'classique/vocal': 'classique',
  'variete': 'variete',
  'variété': 'variete',
  'musique du monde': 'world',
  'r&b': 'r&b',
  'humour': 'humour',
  'theatre': 'theatre',
  'theatre pour enfants': 'theatre-enfants',
  'theatre enfants': 'theatre-enfants',
  'famille': 'famille',
  'cirque': 'cirque',
  'cirque et numeros speciaux': 'cirque',
  'magie': 'magie',
  'magie & illusion': 'magie',
  'danse': 'danse',
  'cabaret': 'cabaret',
  'spectaculaire': 'spectacle',
  'culturel': 'culture',
  'drame': 'theatre',
  'musical': 'musical',
  'monologue': 'humour',
  'sports motorises': 'motorsport',
};

// Genres musicaux → type "nightlife" (soirée/DJ) vs "concert" (live).
const NIGHTLIFE_MUSIC_GENRES = new Set([
  'electro',
  'techno',
  'house',
  'trance',
  'drum-and-bass',
  'dnb',
  'hip-hop',
  'r&b',
  'reggae',
]);

// Mots-clés dans le nom qui basculent automatiquement en nightlife.
const NIGHTLIFE_NAME_RE = /\b(club|dj\s?set|dj\b|nuit|night|after|warehouse|rave|boiler|techno|house\s+music)\b/i;
const FESTIVAL_NAME_RE = /\b(festival|fest\b|solidays|hellfest|main\s+square|rock\s+en\s+seine|vieilles\s+charrues)\b/i;

function normalizeGenre(raw?: string | null): string | null {
  if (!raw) return null;
  const k = stripAccents(raw);
  if (!k || k === 'undefined' || k === 'non defini' || k === 'autre') return null;
  return GENRE_NORMALIZE[k] ?? k.replace(/\s+/g, '-');
}

/**
 * Classifie un event Ticketmaster à partir de son segment/genre/subGenre et nom.
 */
export function classifyTicketmaster(input: {
  segment?: string | null;
  genre?: string | null;
  subGenre?: string | null;
  name?: string | null;
}): ClassifiedEvent {
  const segment = stripAccents(input.segment ?? '');
  const genreN = normalizeGenre(input.genre);
  const subN = normalizeGenre(input.subGenre);
  const name = input.name ?? '';

  const genres: string[] = [];
  if (genreN) genres.push(genreN);
  if (subN && subN !== genreN) genres.push(subN);

  // Festival override par nom (peu importe le segment)
  if (FESTIVAL_NAME_RE.test(name)) {
    return {
      type: 'festival',
      vibe: NIGHTLIFE_MUSIC_GENRES.has(genreN ?? '') ? 'party' : 'concert',
      genres,
      subGenre: subN,
      priority: 30,
    };
  }

  // ---- Segment MUSIQUE ----
  if (segment.startsWith('musique') || segment === 'music') {
    if (NIGHTLIFE_MUSIC_GENRES.has(genreN ?? '') || NIGHTLIFE_NAME_RE.test(name)) {
      return {
        type: 'nightlife',
        vibe: genreN === 'electro' || genreN === 'techno' || genreN === 'house' ? 'rave' : 'nightlife',
        genres,
        subGenre: subN,
        priority: 10,
      };
    }
    // Concert live
    const heavy = genreN === 'metal' || genreN === 'rock';
    return {
      type: 'concert',
      vibe: heavy ? 'energy' : 'concert',
      genres,
      subGenre: subN,
      priority: 20,
    };
  }

  // ---- Segment ARTS & THEATRE ----
  if (segment.startsWith('arts') || segment.includes('theatre')) {
    // Famille / enfants
    if (genreN === 'theatre-enfants' || genreN === 'famille') {
      return { type: 'famille', vibe: 'family', genres, subGenre: subN, priority: 70 };
    }
    // Culturel générique (visite, patrimoine, conférence…)
    if (genreN === 'culture') {
      return { type: 'culture', vibe: 'culture', genres, subGenre: subN, priority: 50 };
    }
    // Spectacle vivant (humour, théâtre, cirque, magie, danse, cabaret…)
    return {
      type: 'spectacle',
      vibe: genreN === 'humour' || genreN === 'cabaret' ? 'party' : 'culture',
      genres,
      subGenre: subN,
      priority: 40,
    };
  }

  // ---- Segment SPORTS ----
  if (segment.startsWith('sport')) {
    return { type: 'sport', vibe: 'sport', genres, subGenre: subN, priority: 60 };
  }

  // ---- Segment FILM ----
  if (segment.startsWith('film') || segment.startsWith('cinema')) {
    return { type: 'cinema', vibe: 'culture', genres, subGenre: subN, priority: 80 };
  }

  // ---- Segment DIVERS ou inconnu ----
  return { type: 'autre', vibe: 'culture', genres, subGenre: subN, priority: 90 };
}
