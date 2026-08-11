import { useEffect, useState } from 'react';
import { MapCtaLink } from '@/components/MapCtaLink';

interface FloatingMapButtonProps {
  cityName: string;
  citySlug: string;
}

// Mobile-only "back to map" pill — appears once the user has scrolled past
// the hero (300px), hides again near the top (<100px) so it doesn't cover
// the CTA that's already there. Hysteresis between the two thresholds
// avoids flicker while scrolling around the boundary.
export function FloatingMapButton({ cityName, citySlug }: FloatingMapButtonProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShow((prev) => {
        if (y > 300) return true;
        if (y < 100) return false;
        return prev;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <MapCtaLink
      to={`/?city=${encodeURIComponent(cityName)}`}
      sourcePage="city"
      sourceSlug={citySlug}
      city={cityName}
      placement="floating"
      className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-neon-pink flex items-center gap-2 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      🗺️ Voir la carte
    </MapCtaLink>
  );
}
