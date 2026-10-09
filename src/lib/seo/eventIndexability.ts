// Shared rule deciding whether an event page deserves indexing.
// Used by the event sitemap (scripts/generate-sitemap.ts) and EventPage (noindex).
// Google flags thin/permanent/expired event pages as "Explorée, non indexée".

export interface IndexableEventInput {
  name: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  source?: string | null;
}

const MAX_DURATION_DAYS = 14;
const MIN_DESCRIPTION = 120;
const GENERIC_TITLE = /^(visite (libre|guid[ée]e)|atelier|exposition permanente|parcours|balade)\b/i;

// Événements hors sujet pour un site de sorties (emploi, administratif, santé...).
// Comparés au nom normalisé (minuscules, sans accents).
const OFF_TOPIC = [
  'job dating', 'jobdating', 'recrutement', 'recrute', 'formation', 'interim', 'permanence',
  'don du sang', 'collecte de sang', 'conseil municipal', 'conseil communautaire', 'point retraite',
  'retraite', 'creation d\'entreprise', 'creer son entreprise', 'accompagnement emploi', 'emploi',
  'webinaire', 'webinar', 'forum des metiers', 'france travail', 'pole emploi', 'cv ', 'entretien d\'embauche',
  'reunion publique', 'reunion d\'information', 'atelier numerique', 'vaccination', 'depistage',
];

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’`]/g, "'");
}

export function isOffTopic(name: string): boolean {
  const n = ` ${normalize(name)} `;
  return OFF_TOPIC.some((k) => n.includes(k));
}

export function isEventIndexable(e: IndexableEventInput, now = new Date()): boolean {
  const start = new Date(e.start_time).getTime();
  const end = e.end_time ? new Date(e.end_time).getTime() : start;
  if (end < now.getTime()) return false; // passé
  if ((end - start) / 86_400_000 > MAX_DURATION_DAYS) return false; // permanent / longue durée
  if ((e.description || '').trim().length < MIN_DESCRIPTION) return false; // contenu trop mince
  if (GENERIC_TITLE.test(e.name.trim())) return false; // visites/ateliers génériques
  if (isOffTopic(e.name)) return false; // emploi, administratif, santé...
  return true;
}
