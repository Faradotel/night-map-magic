import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { usePushNotifications, useShouldShowPushPrompt } from '@/hooks/usePushNotifications';

export function PushPermissionPrompt() {
  const { isSupported, permissionState, subscribe } = usePushNotifications();
  const { show, dismiss } = useShouldShowPushPrompt();

  const visible = show && isSupported && permissionState === 'default';

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  const handleAccept = async () => {
    await subscribe();
    dismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-prompt-title"
    >
      <div className="relative w-full sm:max-w-md bg-card border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 pb-8 animate-scale-in max-h-[92vh] overflow-y-auto">
        <h2 id="push-prompt-title" className="text-2xl font-black text-foreground leading-tight mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6 text-accent shrink-0" />
          Ne rate pas cet event !
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Reçois une alerte quand un event comme celui-ci démarre près de toi
        </p>

        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-secondary border border-border font-bold text-sm active:scale-[0.98] transition-transform"
          >
            Non merci
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-3.5 rounded-2xl bg-accent text-accent-foreground font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-accent/30"
          >
            Oui, m'alerter
          </button>
        </div>
      </div>
    </div>
  );
}
