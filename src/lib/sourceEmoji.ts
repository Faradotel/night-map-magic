/** Returns a source-specific emoji override, respecting event type for Brocabrac */
export function getSourceEmoji(eventId: string, fallbackEmoji: string, eventType = ''): string {
  if (eventId.startsWith('bb-') && eventType !== 'sport') return '🧺';
  if (eventId.startsWith('rt-')) return '🏃‍♂️';
  if (eventId.startsWith('oa-')) return '🗓️';
  return fallbackEmoji;
}
