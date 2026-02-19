export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string; // neon color
  gradient: string;
  condition: string;
  unlocked: boolean;
}

export const allBadges: Badge[] = [
  {
    id: 'first_night',
    name: 'Première Nuit',
    description: 'Ton premier check-in dans un événement',
    emoji: '🌙',
    color: 'hsl(275 71% 58%)',
    gradient: 'linear-gradient(135deg, hsl(275 71% 35%), hsl(258 60% 25%))',
    condition: '1 check-in',
    unlocked: true,
  },
  {
    id: 'explorer',
    name: 'Explorateur',
    description: 'As visité 3 villes différentes',
    emoji: '🗺️',
    color: 'hsl(183 100% 50%)',
    gradient: 'linear-gradient(135deg, hsl(183 100% 25%), hsl(210 80% 20%))',
    condition: '3 villes explorées',
    unlocked: true,
  },
  {
    id: 'nuit_king',
    name: 'Nuit King',
    description: 'Sorti 3 soirs dans la même semaine',
    emoji: '👑',
    color: 'hsl(45 100% 55%)',
    gradient: 'linear-gradient(135deg, hsl(45 100% 30%), hsl(25 90% 25%))',
    condition: '3 nuits/semaine',
    unlocked: true,
  },
  {
    id: 'techno_head',
    name: 'Techno Head',
    description: '5 soirées techno au compteur',
    emoji: '🎧',
    color: 'hsl(315 100% 53%)',
    gradient: 'linear-gradient(135deg, hsl(315 100% 28%), hsl(285 80% 22%))',
    condition: '5 soirées techno',
    unlocked: false,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Le dernier à quitter la piste de danse',
    emoji: '🐦',
    color: 'hsl(183 100% 50%)',
    gradient: 'linear-gradient(135deg, hsl(183 70% 25%), hsl(150 50% 20%))',
    condition: 'Sortie après 5h du matin',
    unlocked: false,
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: '10 soirées visitées',
    emoji: '🦋',
    color: 'hsl(315 100% 53%)',
    gradient: 'linear-gradient(135deg, hsl(315 80% 30%), hsl(275 70% 25%))',
    condition: '10 check-ins',
    unlocked: false,
  },
  {
    id: 'globe_trotter',
    name: 'Globe Trotter',
    description: 'Soirées dans 5 villes différentes',
    emoji: '✈️',
    color: 'hsl(275 71% 58%)',
    gradient: 'linear-gradient(135deg, hsl(220 80% 30%), hsl(260 70% 25%))',
    condition: '5 villes',
    unlocked: false,
  },
  {
    id: 'chill_master',
    name: 'Chill Master',
    description: 'Expert des ambiances cosy et chillout',
    emoji: '🌊',
    color: 'hsl(183 100% 50%)',
    gradient: 'linear-gradient(135deg, hsl(183 90% 20%), hsl(200 70% 18%))',
    condition: '5 événements chill',
    unlocked: false,
  },
];
