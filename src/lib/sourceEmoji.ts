const PLANT_NAME_RE = /\bplantes?\b/i;
const YOGA_NAME_RE = /\byoga\b/i;

/** Returns a source-specific emoji override, respecting event type/subtype */
export function getSourceEmoji(
  eventId: string,
  fallbackEmoji: string,
  eventType = '',
  eventName = '',
): string {
  // Overrides par titre (priorité max)
  if (PLANT_NAME_RE.test(eventName)) return '🌱';
  if (eventType === 'sport' && YOGA_NAME_RE.test(eventName)) return '🧘';

  if (eventId.startsWith('bb-') && eventType !== 'sport') return '🧺';
  if (eventId.startsWith('rt-')) return '🏃‍♂️';
  if (eventId.startsWith('sf-')) return '🏅';
  if (eventId.startsWith('oa-')) {
    // Differentiate OpenAgenda by event type
    switch (eventType) {
      case 'expo': return '🏛️';       // Lieu / exposition / musée
      case 'concert': return '🎵';     // Concert / musique
      case 'sport': return '🏅';       // Sport
      case 'afterwork': return '🎓';   // Atelier / conférence
      default: return '🎭';            // Spectacle / événement général
    }
  }
  return fallbackEmoji;
}
