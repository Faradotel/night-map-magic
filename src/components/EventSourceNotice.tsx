import { ExternalLink } from 'lucide-react';
import { getEventSource } from '@/lib/eventSource';

interface Props {
  eventId: string;
  url?: string | null;
  className?: string;
}

/** Mention "Source : X" avec lien vers la page de l'evenement chez la source. */
export function EventSourceNotice({ eventId, url, className = '' }: Props) {
  const src = getEventSource(eventId);
  if (!src) return null;
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          data-no-affiliate={src.key === 'ticketmaster' ? 'true' : undefined}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
        >
          {src.attribution}
          <ExternalLink size={11} aria-hidden="true" />
        </a>
      ) : (
        src.attribution
      )}
    </p>
  );
}
