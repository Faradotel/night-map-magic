import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DISMISSED_STORAGE_KEY = 'pulsemap_push_dismissed';

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export type PermissionState = 'default' | 'granted' | 'denied';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) view[i] = rawData.charCodeAt(i);
  return buffer;
}

function isIOSNonPWADevice(): boolean {
  return /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone;
}

interface UsePushNotificationsResult {
  isSupported: boolean;
  isIOSNonPWA: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permissionState: PermissionState;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth();
  const [isIOSNonPWA] = useState(() => isIOSNonPWADevice());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission as PermissionState;
  });

  const isSupported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !isIOSNonPWA;

  useEffect(() => {
    if (!isSupported || !user) {
      setIsSubscribed(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (!existing) {
        if (!cancelled) setIsSubscribed(false);
        return;
      }
      const { count } = await supabase
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('endpoint', existing.endpoint);
      if (!cancelled) setIsSubscribed((count ?? 0) > 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [isSupported, user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY as string);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
        { onConflict: 'endpoint' },
      );
      if (error) throw error;

      setIsSubscribed(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isIOSNonPWA, isSubscribed, isLoading, permissionState, subscribe, unsubscribe };
}

export function useShouldShowPushPrompt() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(DISMISSED_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, '1');
    } catch {}
    setShow(false);
  }, []);

  return { show, dismiss };
}
