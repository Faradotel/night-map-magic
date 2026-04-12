/** Returns a source-specific emoji override, respecting event type/subtype */
export function getSourceEmoji(eventId: string, fallbackEmoji: string, eventType = ''): string {
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
