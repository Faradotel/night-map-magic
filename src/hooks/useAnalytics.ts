declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export type AnalyticsEventName =
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'filter_applied'
  | 'event_clicked'
  | 'map_interaction';

export function useAnalytics() {
  const trackEvent = (name: AnalyticsEventName, props?: Record<string, string | number | boolean>) => {
    if (!import.meta.env.PROD) return;
    window.plausible?.(name, props ? { props } : undefined);
  };

  return { trackEvent };
}
