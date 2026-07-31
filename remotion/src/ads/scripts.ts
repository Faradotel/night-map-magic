export type Beat =
  | { type: "hook"; lines: string[]; accentLine?: number; kicker?: string; dur: number }
  | { type: "lines"; items: string[]; strike?: boolean; dur: number }
  | { type: "stat"; value: number; suffix?: string; label: string; dur: number }
  | { type: "chips"; items: string[]; title: string; dur: number }
  | { type: "steps"; items: string[]; dur: number }
  | { type: "cta"; line: string; dur: number };

export interface AdScript {
  id: string;
  title: string;
  accent: "pink" | "cyan" | "lime";
  beats: Beat[];
}

const CTA = (line = "pulse-map.live"): Beat => ({ type: "cta", line, dur: 70 });

export const ADS: AdScript[] = [
  {
    id: "ad01",
    title: "Ce soir tu fais quoi",
    accent: "pink",
    beats: [
      { type: "hook", lines: ["CE SOIR", "TU FAIS", "QUOI ?"], accentLine: 2, kicker: "22H47", dur: 70 },
      { type: "lines", items: ["Insta ? vide.", "Google ? nul.", "Potes ? zéro idée."], strike: true, dur: 90 },
      { type: "hook", lines: ["UNE", "CARTE.", "TOUT."], accentLine: 2, kicker: "PULSEMAP", dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad02",
    title: "Tout est sur une carte",
    accent: "cyan",
    beats: [
      { type: "hook", lines: ["ARRÊTE", "DE", "CHERCHER"], accentLine: 1, kicker: "SORTIR CE SOIR", dur: 70 },
      { type: "chips", title: "SUR UNE SEULE CARTE", items: ["Concerts", "Clubs", "Festivals", "Afterworks", "Bars", "Expos"], dur: 100 },
      { type: "hook", lines: ["EN LIVE.", "AUTOUR", "DE TOI."], accentLine: 1, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad03",
    title: "115 villes",
    accent: "lime",
    beats: [
      { type: "stat", value: 115, label: "VILLES FRANÇAISES", dur: 80 },
      { type: "chips", title: "PARTOUT EN FRANCE", items: ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Grenoble", "Nantes", "Toulouse"], dur: 100 },
      { type: "hook", lines: ["TA VILLE", "EST", "DEDANS."], accentLine: 2, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad04",
    title: "3 secondes",
    accent: "pink",
    beats: [
      { type: "hook", lines: ["3", "SECONDES."], accentLine: 0, kicker: "PAS PLUS", dur: 60 },
      { type: "steps", items: ["T'ouvres la carte", "Tu vois ce qui bouge", "T'y vas"], dur: 110 },
      { type: "hook", lines: ["PAS DE", "COMPTE.", "PAS DE PUB."], accentLine: 1, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad05",
    title: "Gratuit",
    accent: "cyan",
    beats: [
      { type: "hook", lines: ["100 %", "GRATUIT"], accentLine: 1, kicker: "SANS INSCRIPTION", dur: 70 },
      { type: "lines", items: ["Zéro compte", "Zéro abonnement", "Zéro excuse"], dur: 90 },
      { type: "hook", lines: ["OUVRE.", "REGARDE.", "SORS."], accentLine: 2, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad06",
    title: "Temps réel",
    accent: "lime",
    beats: [
      { type: "hook", lines: ["CE QUI", "BOUGE", "MAINTENANT"], accentLine: 1, kicker: "TEMPS RÉEL", dur: 75 },
      { type: "stat", value: 4, suffix: "H", label: "MISE À JOUR EN CONTINU", dur: 75 },
      { type: "hook", lines: ["PLUS", "JAMAIS", "À CÔTÉ."], accentLine: 1, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad07",
    title: "Fini les 12 onglets",
    accent: "pink",
    beats: [
      { type: "hook", lines: ["12", "ONGLETS", "OUVERTS ?"], accentLine: 0, kicker: "STOP", dur: 70 },
      { type: "lines", items: ["Shotgun", "Ticketmaster", "Facebook", "Le groupe WhatsApp"], strike: true, dur: 100 },
      { type: "hook", lines: ["UNE", "SEULE", "CARTE."], accentLine: 2, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad08",
    title: "Autour de moi",
    accent: "cyan",
    beats: [
      { type: "hook", lines: ["QUOI", "AUTOUR", "DE MOI ?"], accentLine: 2, kicker: "GPS ON", dur: 70 },
      { type: "chips", title: "À MOINS DE 2 KM", items: ["Techno", "Live", "Rooftop", "Afterwork", "House", "Rap"], dur: 100 },
      { type: "hook", lines: ["LA SOIRÉE", "EST", "À CÔTÉ."], accentLine: 2, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad09",
    title: "Week-end",
    accent: "lime",
    beats: [
      { type: "hook", lines: ["VENDREDI", "19H"], accentLine: 1, kicker: "LE MOMENT", dur: 65 },
      { type: "steps", items: ["Le week-end démarre", "La carte est déjà pleine", "Toi t'hésites encore"], dur: 110 },
      { type: "hook", lines: ["CHOISIS.", "SORS."], accentLine: 1, dur: 70 },
      CTA(),
    ],
  },
  {
    id: "ad10",
    title: "Concerts et festivals",
    accent: "pink",
    beats: [
      { type: "hook", lines: ["CONCERTS.", "CLUBS.", "FESTIVALS."], accentLine: 2, kicker: "TOUT EST LÀ", dur: 75 },
      { type: "stat", value: 1000, suffix: "+", label: "ÉVÉNEMENTS GÉOLOCALISÉS", dur: 80 },
      { type: "hook", lines: ["TROUVE", "LE TIEN."], accentLine: 1, dur: 65 },
      CTA(),
    ],
  },
];
