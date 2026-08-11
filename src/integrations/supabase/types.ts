export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          owner_id: string | null
          revoked_at: string | null
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          owner_id?: string | null
          revoked_at?: string | null
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          owner_id?: string | null
          revoked_at?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      cached_events: {
        Row: {
          address: string
          city: string
          created_at: string
          created_by: string | null
          description: string
          end_time: string | null
          external_attendees: number | null
          genres: string[]
          id: string
          image_color: string
          image_url: string | null
          lat: number
          lng: number
          name: string
          price_range: string
          priority: number
          source: string
          start_time: string
          sub_genre: string | null
          ticket_url: string | null
          type: string
          updated_at: string
          venue: string
          vibe: string
        }
        Insert: {
          address?: string
          city: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_time?: string | null
          external_attendees?: number | null
          genres?: string[]
          id: string
          image_color?: string
          image_url?: string | null
          lat: number
          lng: number
          name: string
          price_range?: string
          priority?: number
          source?: string
          start_time: string
          sub_genre?: string | null
          ticket_url?: string | null
          type: string
          updated_at?: string
          venue?: string
          vibe: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_time?: string | null
          external_attendees?: number | null
          genres?: string[]
          id?: string
          image_color?: string
          image_url?: string | null
          lat?: number
          lng?: number
          name?: string
          price_range?: string
          priority?: number
          source?: string
          start_time?: string
          sub_genre?: string | null
          ticket_url?: string | null
          type?: string
          updated_at?: string
          venue?: string
          vibe?: string
        }
        Relationships: []
      }
      city_seo_intros: {
        Row: {
          city_name: string
          city_slug: string
          created_at: string
          events_snapshot: Json | null
          generated_at: string
          h1: string
          intro_html: string
          meta_description: string
          model: string
          updated_at: string
          version: number
        }
        Insert: {
          city_name: string
          city_slug: string
          created_at?: string
          events_snapshot?: Json | null
          generated_at?: string
          h1: string
          intro_html: string
          meta_description: string
          model?: string
          updated_at?: string
          version?: number
        }
        Update: {
          city_name?: string
          city_slug?: string
          created_at?: string
          events_snapshot?: Json | null
          generated_at?: string
          h1?: string
          intro_html?: string
          meta_description?: string
          model?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          created_at: string
          event_city: string
          event_date: string | null
          event_id: string
          event_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_city: string
          event_date?: string | null
          event_id: string
          event_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_city?: string
          event_date?: string | null
          event_id?: string
          event_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_favorites: {
        Row: {
          created_at: string
          event_city: string
          event_date: string | null
          event_id: string
          event_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_city: string
          event_date?: string | null
          event_id: string
          event_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_city?: string
          event_date?: string | null
          event_id?: string
          event_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_passes: {
        Row: {
          created_at: string
          event_id: string
          event_name: string
          id: string
          image_path: string | null
          qr_data: string | null
          used_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          event_name: string
          id?: string
          image_path?: string | null
          qr_data?: string | null
          used_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          event_name?: string
          id?: string
          image_path?: string | null
          qr_data?: string | null
          used_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: string
          to_user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          friend_attendance_enabled: boolean
          id: string
          new_event_alerts_enabled: boolean
          preferred_genres: string[]
          preferred_vibes: string[]
          push_enabled: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_attendance_enabled?: boolean
          id?: string
          new_event_alerts_enabled?: boolean
          preferred_genres?: string[]
          preferred_vibes?: string[]
          push_enabled?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          friend_attendance_enabled?: boolean
          id?: string
          new_event_alerts_enabled?: boolean
          preferred_genres?: string[]
          preferred_vibes?: string[]
          push_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          related_event_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          related_event_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          related_event_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notified_events: {
        Row: {
          event_id: string
          notified_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          notified_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          notified_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_index_status: {
        Row: {
          check_error: string | null
          coverage_state: string | null
          created_at: string
          first_tracked_at: string
          google_canonical: string | null
          id: string
          is_indexed: boolean
          last_checked_at: string | null
          last_crawl_time: string | null
          retire_reason: string | null
          retired_at: string | null
          tier: number | null
          updated_at: string
          url: string
          user_canonical: string | null
          verdict: string | null
        }
        Insert: {
          check_error?: string | null
          coverage_state?: string | null
          created_at?: string
          first_tracked_at?: string
          google_canonical?: string | null
          id?: string
          is_indexed?: boolean
          last_checked_at?: string | null
          last_crawl_time?: string | null
          retire_reason?: string | null
          retired_at?: string | null
          tier?: number | null
          updated_at?: string
          url: string
          user_canonical?: string | null
          verdict?: string | null
        }
        Update: {
          check_error?: string | null
          coverage_state?: string | null
          created_at?: string
          first_tracked_at?: string
          google_canonical?: string | null
          id?: string
          is_indexed?: boolean
          last_checked_at?: string | null
          last_crawl_time?: string | null
          retire_reason?: string | null
          retired_at?: string | null
          tier?: number | null
          updated_at?: string
          url?: string
          user_canonical?: string | null
          verdict?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          preferred_city: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          preferred_city?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          preferred_city?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      push_outbox: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_at: string | null
          status: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      share_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      cleanup_startup_cron: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_event_attendance_count: {
        Args: { _event_id: string }
        Returns: number
      }
      get_friend_hotspots: {
        Args: { _limit?: number; _min_friends?: number }
        Returns: {
          event_city: string
          event_date: string
          event_id: string
          event_name: string
          friend_count: number
          friend_usernames: string[]
        }[]
      }
      get_live_events: {
        Args: { _limit?: number; _since_hours?: number }
        Returns: {
          check_ins: number
          event_city: string
          event_date: string
          event_id: string
          event_name: string
        }[]
      }
      get_tonight_hotspots: {
        Args: { _limit?: number }
        Returns: {
          check_ins: number
          event_city: string
          event_date: string
          event_id: string
          event_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_share_code: {
        Args: { _code: string }
        Returns: {
          expires_at: string
          user_id: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_event_pass: { Args: { _pass_id: string }; Returns: Json }
      verify_api_key: {
        Args: { _key_hash: string }
        Returns: {
          id: string
          name: string
          owner_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "pro" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pro", "user"],
    },
  },
} as const
