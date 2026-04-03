/** Returns a source-specific emoji override for Brocabrac, RunTrail, OpenAgenda events */
export function getSourceEmoji(eventId: string, fallbackEmoji: string): string {
  if (eventId.startsWith('bb-')) return '🧺';
  if (eventId.startsWith('rt-')) return '🏃‍♂️';
  if (eventId.startsWith('oa-')) return '🗓️';
  return fallbackEmoji;
}
