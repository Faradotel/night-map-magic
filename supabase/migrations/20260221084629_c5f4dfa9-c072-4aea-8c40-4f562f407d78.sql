
-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  preferred_city TEXT DEFAULT 'Paris',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. FRIENDSHIPS (normalized: user_a < user_b)
-- ============================================
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. FRIEND REQUESTS
-- ============================================
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. SHARE CODES (for friend invite links)
-- ============================================
CREATE TABLE public.share_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.share_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. EVENT ATTENDANCE
-- ============================================
CREATE TABLE public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_city TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  related_event_id TEXT,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  friend_attendance_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (security definer)
-- ============================================

-- Check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_a = LEAST(_user_a, _user_b) AND user_b = GREATEST(_user_a, _user_b))
  )
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- FRIENDSHIPS
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- FRIEND REQUESTS
CREATE POLICY "Users can view own requests" ON public.friend_requests FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send requests" ON public.friend_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND from_user_id != to_user_id);
CREATE POLICY "Recipients can update requests" ON public.friend_requests FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id);

-- SHARE CODES
CREATE POLICY "Users can view own codes" ON public.share_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create codes" ON public.share_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own codes" ON public.share_codes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- EVENT ATTENDANCE
CREATE POLICY "Anyone authenticated can view attendance" ON public.event_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can mark attendance" ON public.event_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own attendance" ON public.event_attendance FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES
CREATE POLICY "Users can view own prefs" ON public.notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile + notification prefs on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8));
  
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create friendship when request accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friendships (user_a, user_b)
    VALUES (LEAST(NEW.from_user_id, NEW.to_user_id), GREATEST(NEW.from_user_id, NEW.to_user_id))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_friend_request_accepted();

-- Notify friends when user marks attendance
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
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_attendance_created
  AFTER INSERT ON public.event_attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_attendance_notify();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
