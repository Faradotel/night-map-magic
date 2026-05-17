import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface BackButtonProps {
  label?: string;
}

export function useSwipeBack(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    const EDGE_THRESHOLD = 40; // px from left edge
    const SWIPE_THRESHOLD = 80; // px horizontal distance

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const startedNearEdge = startX <= EDGE_THRESHOLD;
      const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);

      if (startedNearEdge && isHorizontalSwipe && dx > SWIPE_THRESHOLD) {
        window.history.back();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled]);
}

export function BackButton({ label = 'Retour à la carte' }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    // If we came from within the app (state or key indicates internal nav), go back in history
    if (window.history.length > 1 && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate, location]);

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      style={{ color: 'hsl(var(--muted-foreground))' }}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
