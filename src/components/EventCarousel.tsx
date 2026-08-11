import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EventCard, EventCardData } from '@/components/EventCard';
import { ScrollReveal } from '@/components/ScrollReveal';

interface CarouselItem {
  event: EventCardData;
  href: string;
  dateLabel: string;
}

interface EventCarouselProps {
  items: CarouselItem[];
}

// Horizontal, snap-to-2-columns row instead of a long vertical grid — arrows
// page through it on desktop (hidden on touch/mobile, where the native
// horizontal swipe already does the job).
export function EventCarousel({ items }: EventCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const updateArrows = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hidden snap-x snap-mandatory scroll-smooth"
      >
        {items.map(({ event, href, dateLabel }, i) => (
          <div key={event.id} className="w-[calc(50%-0.375rem)] shrink-0 snap-start">
            <ScrollReveal delayMs={Math.min(i, 8) * 50}>
              <EventCard event={event} variant="grid" href={href} dateLabel={dateLabel} />
            </ScrollReveal>
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Événements précédents"
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-background border border-border shadow-lg text-foreground"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Événements suivants"
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-background border border-border shadow-lg text-foreground"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
