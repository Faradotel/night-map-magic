-- Extend the existing friend-attendance notifier to also fire a Web Push
-- notification, for friends who have an active push subscription. This
-- CREATE OR REPLACE keeps the same function name, so the existing
-- on_attendance_created trigger (and the earlier REVOKE EXECUTE lockdown)
-- both still apply without redefinition.
--
-- Requires a Vault secret named 'push_notification_service_key' holding a
-- Supabase service-role key — create it manually (not checked in here):
--   select vault.create_secret('<service-role-key-value>', 'push_notification_service_key', 'Service role key for send-push-notification trigger calls');
CREATE OR REPLACE FUNCTION public.handle_attendance_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  friend_id UUID;
  attendee_name TEXT;
BEGIN
  SELECT username INTO attendee_name FROM public.profiles WHERE user_id = NEW.user_id;

  FOR friend_id IN
    SELECT CASE WHEN user_a = NEW.user_id THEN user_b ELSE user_a END
    FROM public.friendships
    WHERE user_a = NEW.user_id OR user_b = NEW.user_id
  LOOP
    -- Check if friend has notifications enabled
    IF EXISTS (
      SELECT 1 FROM public.notification_preferences
      WHERE user_id = friend_id AND friend_attendance_enabled = true
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, body, related_event_id, related_user_id)
      VALUES (
        friend_id,
        'friend_attendance',
        COALESCE(attendee_name, 'Un ami') || ' va à une soirée !',
        COALESCE(attendee_name, 'Un ami') || ' a prévu d''aller à ' || NEW.event_name,
        NEW.event_id,
        NEW.user_id
      );

      IF EXISTS (SELECT 1 FROM public.push_subscriptions WHERE user_id = friend_id) THEN
        PERFORM net.http_post(
          url := 'https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'push_notification_service_key')
          ),
          body := jsonb_build_object(
            'user_id', friend_id,
            'title', COALESCE(attendee_name, 'Un ami') || ' va à une soirée !',
            'body', COALESCE(attendee_name, 'Un ami') || ' a prévu d''aller à ' || NEW.event_name,
            'url', '/evenements/' || NEW.event_id
          )
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
