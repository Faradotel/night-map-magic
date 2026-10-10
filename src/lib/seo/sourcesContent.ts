// Contenu de la page /sources, partage entre la page React (SourcesPage.tsx)
// et le prerendu (scripts/prerender.ts) pour que le HTML statique et React
// restent identiques. Aucune dependance navigateur ici.
import { CONTACT_EMAIL, CONTACT_FALLBACK_TEXT } from '../legal';
import { SITE_URL } from './seoHead';

export interface SourceEntry {
  name: string;
  url: string;
  role: string;
  shown: string;
  license: string;
}

export const SOURCES_LAST_UPDATED = '10 octobre 2026';

export const SOURCE_ENTRIES: SourceEntry[] = [
  {
    name: 'OpenAgenda',
    url: 'https://openagenda.com',
    role: "Agendas publics d'événements culturels, festifs et associatifs publiés par les organisateurs.",
    shown: "Titre, date, lieu, courte description et lien vers la page de l'événement sur OpenAgenda.",
    license: 'Données publiées sous licence ouverte par leurs auteurs, via l\'API officielle OpenAgenda. Mention affichée sur chaque événement : "Source : OpenAgenda (licence ouverte)".',
  },
  {
    name: 'Ticketmaster',
    url: 'https://www.ticketmaster.fr',
    role: 'Concerts, spectacles et événements sportifs, via l\'API officielle Ticketmaster Discovery.',
    shown: 'Titre, date, lieu et lien vers la page de billetterie Ticketmaster. Mention affichée sur chaque événement : "Source : Ticketmaster".',
    license: "Utilisation selon les conditions de l'API Ticketmaster. Aucun lien d'affiliation ni mécanisme de revenu n'est appliqué à ces liens. Les événements passés sont supprimés et l'horizon est limité à 90 jours.",
  },
  {
    name: 'Eventbrite',
    url: 'https://www.eventbrite.fr',
    role: "Événements publics publiés par les organisateurs sur Eventbrite, via l'API officielle.",
    shown: "Titre, date, lieu et lien vers la page de l'événement sur Eventbrite.",
    license: "Utilisation selon les conditions de l'API Eventbrite.",
  },
  {
    name: 'Meetup',
    url: 'https://www.meetup.com',
    role: 'Rencontres et afterworks publics publiés sur Meetup.',
    shown: "Titre, date, lieu et lien vers la page de l'événement sur Meetup.",
    license: 'Utilisation selon les conditions de Meetup.',
  },
  {
    name: 'Saisies de professionnels',
    url: `${SITE_URL}/`,
    role: 'Événements ajoutés directement dans PulseMap par des organisateurs ou lieux disposant d\'un compte professionnel, ou saisis à la main par l\'équipe.',
    shown: 'Les informations fournies par l\'organisateur, sous sa responsabilité.',
    license: "L'organisateur garantit disposer des droits sur les textes et images publiés.",
  },
  {
    name: 'OpenStreetMap et Esri',
    url: 'https://www.openstreetmap.org/copyright',
    role: "Fond de carte (tuiles Esri, données OpenStreetMap) et géocodage des adresses (OpenStreetMap via Nominatim et Photon, Base Adresse Nationale).",
    shown: 'Carte interactive et position des lieux.',
    license: 'Données OpenStreetMap sous licence ODbL, "© OpenStreetMap contributors". Attribution affichée en permanence sur la carte.',
  },
];

export const SOURCES_INTRO =
  "PulseMap rassemble sur une carte des événements publiés par des tiers. Pour chaque événement, PulseMap affiche uniquement des informations de base (titre, date, lieu, lien). Le détail complet, les conditions et la billetterie restent chez la source d'origine : PulseMap ne vend aucun billet.";

export const SOURCES_DISCLAIMER =
  "Les informations d'événements proviennent de tiers et ne sont pas garanties : horaires, prix et programmation peuvent changer. Vérifie toujours auprès de la source avant de te déplacer.";

export function takedownText(): string {
  const contact = CONTACT_EMAIL ? `à l'adresse ${CONTACT_EMAIL}` : CONTACT_FALLBACK_TEXT;
  return `Un organisateur, un artiste ou tout ayant droit peut demander le retrait ou la correction d'un événement ${contact}, en indiquant le lien de la page concernée. La demande est traitée sous 24 heures.`;
}

export const SOURCES_META = {
  title: 'Sources et licences | PulseMap',
  description:
    "D'où viennent les événements de PulseMap : OpenAgenda, Ticketmaster, Eventbrite, Meetup, saisies de professionnels et OpenStreetMap. Licences, attribution et demande de retrait.",
  canonical: '/sources',
  h1: 'Sources et licences',
};
