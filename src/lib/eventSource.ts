// Source d'un evenement, deduite du prefixe de son identifiant.
// Sert aux mentions d'attribution ("Source : ...") exigees par les fournisseurs.

export interface EventSourceInfo {
  key: string;
  name: string;
  short: string;
  /** Libelle d'attribution affiche sur la page et la fiche. */
  attribution: string;
  color: string;
}

const SOURCES: Array<{ prefix: string } & EventSourceInfo> = [
  { prefix: 'tm-', key: 'ticketmaster', name: 'Ticketmaster', short: 'TM', attribution: 'Source : Ticketmaster', color: 'hsl(210 100% 56%)' },
  { prefix: 'oa-', key: 'openagenda', name: 'OpenAgenda', short: 'OA', attribution: 'Source : OpenAgenda (licence ouverte)', color: 'hsl(160 70% 42%)' },
  { prefix: 'eb-', key: 'eventbrite', name: 'Eventbrite', short: 'EB', attribution: 'Source : Eventbrite', color: 'hsl(15 85% 55%)' },
  { prefix: 'mu-', key: 'meetup', name: 'Meetup', short: 'MU', attribution: 'Source : Meetup', color: 'hsl(0 82% 55%)' },
];

export function getEventSource(id: string | null | undefined): EventSourceInfo | null {
  if (!id) return null;
  const s = SOURCES.find((x) => id.startsWith(x.prefix));
  if (!s) return null;
  const { prefix: _p, ...info } = s;
  return info;
}

/** True si les liens de cet evenement ne doivent subir aucune transformation d'affiliation. */
export function isNoAffiliateUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /(^|\.)ticketmaster\.[a-z.]+|(^|\.)livenation\.[a-z.]+/i.test(safeHost(url));
}

function safeHost(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}
