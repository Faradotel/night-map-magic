import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

type MapCtaSourcePage = 'city' | 'event' | 'category' | 'genre' | 'vibe' | 'cities_index';

interface MapCtaLinkProps {
  to: string;
  sourcePage: MapCtaSourcePage;
  sourceSlug?: string;
  city?: string;
  placement?: 'inline' | 'floating';
  className: string;
  children: ReactNode;
}

// Thin tracked wrapper around every "Voir la carte" link across the SEO
// pages — behavior only, each page keeps its own existing className/copy.
export function MapCtaLink({ to, sourcePage, sourceSlug, city, placement = 'inline', className, children }: MapCtaLinkProps) {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    const props: Record<string, string | number | boolean> = { source_page: sourcePage, placement };
    if (sourceSlug) props.source_slug = sourceSlug;
    if (city) props.city = city;
    trackEvent('map_cta_clicked', props);
  };

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
