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
// NB: on garde uniquement les genres 100% club/électro. Rap, r&b, reggae sur
// Ticketmaster sont quasi-toujours des concerts live en salle (Zénith, Accor…),
// pas des DJ sets. Les vrais clubbings sont attrapés par NIGHTLIFE_NAME_RE.
const NIGHTLIFE_MUSIC_GENRES = new Set([
  'electro',
  'techno',
  'house',
  'trance',
  'drum-and-bass',
  'dnb',
]);

// Mots-clés dans le nom qui basculent automatiquement en nightlife.
const NIGHTLIFE_NAME_RE = /\b(club|dj\s?set|dj\b|nuit|night|after|warehouse|rave|boiler|techno|house\s+music)\b/i;
const FESTIVAL_NAME_RE = /\b(festival|fest\b|solidays|hellfest|main\s+square|rock\s+en\s+seine|vieilles\s+charrues)\b/i;
const CONCERT_NAME_OVERRIDE_RE = /\bconcert\b/i;

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

  // "Concert" dans le nom mais segment != Musique → TM classe souvent les
  // petits organisateurs/salles associatives sous "Arts & Théâtre / Culturel".
  // On corrige par le nom plutôt que de faire confiance à leur taxonomie.
  if (CONCERT_NAME_OVERRIDE_RE.test(name)) {
    return { type: 'concert', vibe: 'concert', genres, subGenre: subN, priority: 20 };
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

// ---------------------------------------------------------------------------
// Classifier générique pour Eventbrite / Meetup / Shotgun / brocante free-text.
// Prend une catégorie libre (ex "music", "tech", "networking", "sport"…) +
// des genres/tags + le nom, et sort le même schéma que classifyTicketmaster.
// ---------------------------------------------------------------------------

const NIGHTLIFE_MUSIC_GENRES_G = new Set([
  'electro', 'techno', 'house', 'trance', 'drum-and-bass', 'dnb', 'hardstyle',
  'hardcore', 'psytrance', 'tech-house', 'deep-house', 'afro-house', 'minimal',
  'hip-hop', 'rap', 'r&b', 'reggae', 'dancehall', 'afrobeat', 'afrobeats',
  'trap', 'dubstep', 'bass', 'edm', 'club',
]);

const NIGHTLIFE_NAME_RE_G = /\b(club|dj\s?set|dj\b|nuit|night|after|warehouse|rave|boiler|open\s?air|soir[ée]e|clubbing|party)\b/i;
const FESTIVAL_NAME_RE_G = /\b(festival|fest\b|solidays|hellfest|main\s+square|rock\s+en\s+seine|vieilles\s+charrues|weekender)\b/i;
const AFTERWORK_NAME_RE = /\b(afterwork|after\s?work|apero|apéro|5\s?à\s?7|happy\s?hour|networking\s?apero)\b/i;
const CONCERT_NAME_RE = /\b(concert|live|showcase|acoustique|en\s+live|tour\b|tournée|gig)\b/i;
const SPORT_NAME_RE = /\b(course|trail|marathon|semi|10\s?km|run|running|randonnée|rando|match|tournoi|fitness|yoga|crossfit|padel|escalade|climbing)\b/i;
const EXPO_NAME_RE = /\b(expo|exposition|vernissage|galerie|mus[ée]e|salon\b)\b/i;
const FAMILLE_NAME_RE = /\b(enfants?|kids?|famille|parent-enfant|atelier\s+enfants?|jeune\s+public)\b/i;
const CINEMA_NAME_RE = /\b(cin[ée]ma|projection|s[ée]ance|film|court[- ]m[ée]trage)\b/i;
const CULTURE_NAME_RE = /\b(confer[ée]nce|talk|meetup|workshop|atelier|formation|hackathon|coding|tech\b|conf[ée]rence)\b/i;
const THEATRE_NAME_RE = /\b(th[ée][aâ]tre|spectacle|humour|stand[- ]up|impro|com[ée]die|magie|cirque|cabaret|op[ée]ra|danse)\b/i;

function classifyByGenres(genres: string[]): { isNightlifeMusic: boolean; isMusic: boolean } {
  const norm = genres.map((g) => normalizeGenre(g) || '').filter(Boolean);
  const isNightlife = norm.some((g) => NIGHTLIFE_MUSIC_GENRES_G.has(g));
  const musicHints = new Set(['pop', 'rock', 'jazz', 'metal', 'classique', 'chanson', 'variete', 'world', 'reggae', 'blues', 'folk', 'indie', 'punk', 'soul', 'funk', 'disco']);
  const isMusic = isNightlife || norm.some((g) => musicHints.has(g));
  return { isNightlifeMusic: isNightlife, isMusic };
}

/**
 * Classifie un event à partir d'une catégorie libre + genres + nom.
 * Utilisé par Eventbrite / Meetup / Shotgun où le fetcher ne connaît qu'un
 * label vague ("music", "tech", "sport"…).
 */
export function classifyGeneric(input: {
  category?: string | null;
  name?: string | null;
  genres?: string[];
  /** Hint fort: force la branche musique (ex: Shotgun où tout est nightlife). */
  forceNightlifeIfMusic?: boolean;
}): ClassifiedEvent {
  const cat = stripAccents(input.category ?? '');
  const name = input.name ?? '';
  const rawGenres = input.genres ?? [];
  const genres = rawGenres.map((g) => normalizeGenre(g)).filter((g): g is string => !!g);
  const subGenre = genres[0] ?? null;

  // Overrides par nom (priorité max)
  if (FESTIVAL_NAME_RE_G.test(name)) {
    return { type: 'festival', vibe: 'concert', genres, subGenre, priority: 30 };
  }
  if (NIGHTLIFE_NAME_RE_G.test(name)) {
    const { isNightlifeMusic } = classifyByGenres(rawGenres);
    return {
      type: 'nightlife',
      vibe: isNightlifeMusic || genres.some((g) => ['electro', 'techno', 'house'].includes(g)) ? 'rave' : 'nightlife',
      genres,
      subGenre,
      priority: 10,
    };
  }
  if (AFTERWORK_NAME_RE.test(name)) {
    return { type: 'afterwork', vibe: 'afterwork', genres, subGenre, priority: 25 };
  }

  // Catégorie explicite
  switch (cat) {
    case 'music':
    case 'musique':
    case 'concert': {
      const { isNightlifeMusic } = classifyByGenres(rawGenres);
      if ((input.forceNightlifeIfMusic || isNightlifeMusic) && !CONCERT_NAME_RE.test(name)) {
        return {
          type: 'nightlife',
          vibe: genres.some((g) => ['electro', 'techno', 'house'].includes(g)) ? 'rave' : 'nightlife',
          genres,
          subGenre,
          priority: 10,
        };
      }
      return { type: 'concert', vibe: 'concert', genres, subGenre, priority: 20 };
    }
    case 'festival':
      return { type: 'festival', vibe: 'concert', genres, subGenre, priority: 30 };
    case 'sport':
    case 'sports':
    case 'outdoor':
      return { type: 'sport', vibe: 'sport', genres, subGenre, priority: 60 };
    case 'theatre':
    case 'spectacle':
    case 'humour':
    case 'comedy':
      return { type: 'spectacle', vibe: genres.includes('humour') ? 'party' : 'culture', genres, subGenre, priority: 40 };
    case 'expo':
    case 'exposition':
    case 'art':
    case 'culture':
    case 'museum':
      return { type: 'culture', vibe: 'culture', genres, subGenre, priority: 50 };
    case 'family':
    case 'famille':
    case 'kids':
      return { type: 'famille', vibe: 'family', genres, subGenre, priority: 70 };
    case 'cinema':
    case 'film':
      return { type: 'cinema', vibe: 'culture', genres, subGenre, priority: 80 };
    case 'tech':
    case 'networking':
    case 'business':
    case 'workshop':
    case 'language':
    case 'games':
    case 'food':
      return { type: 'culture', vibe: 'chill', genres, subGenre, priority: 55 };
    default:
      break;
  }

  // Fallback via nom
  if (FAMILLE_NAME_RE.test(name)) return { type: 'famille', vibe: 'family', genres, subGenre, priority: 70 };
  if (SPORT_NAME_RE.test(name)) return { type: 'sport', vibe: 'sport', genres, subGenre, priority: 60 };
  if (CINEMA_NAME_RE.test(name)) return { type: 'cinema', vibe: 'culture', genres, subGenre, priority: 80 };
  if (EXPO_NAME_RE.test(name)) return { type: 'culture', vibe: 'culture', genres, subGenre, priority: 50 };
  if (THEATRE_NAME_RE.test(name)) return { type: 'spectacle', vibe: 'culture', genres, subGenre, priority: 40 };
  if (CONCERT_NAME_RE.test(name)) return { type: 'concert', vibe: 'concert', genres, subGenre, priority: 20 };
  if (CULTURE_NAME_RE.test(name)) return { type: 'culture', vibe: 'chill', genres, subGenre, priority: 55 };

  const { isNightlifeMusic, isMusic } = classifyByGenres(rawGenres);
  if (isNightlifeMusic) {
    return {
      type: 'nightlife',
      vibe: genres.some((g) => ['electro', 'techno', 'house'].includes(g)) ? 'rave' : 'nightlife',
      genres,
      subGenre,
      priority: 10,
    };
  }
  if (isMusic) {
    return { type: 'concert', vibe: 'concert', genres, subGenre, priority: 20 };
  }

  return { type: 'autre', vibe: 'culture', genres, subGenre, priority: 90 };
}
