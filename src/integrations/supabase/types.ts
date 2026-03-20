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
      assets: {
        Row: {
          asset_type: string
          created_at: string
          filename: string | null
          id: string
          project_id: string
          storage_path: string
          tag: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          filename?: string | null
          id?: string
          project_id: string
          storage_path: string
          tag?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          filename?: string | null
          id?: string
          project_id?: string
          storage_path?: string
          tag?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credits: number
          email: string | null
          id: string
          plan: string
          preferred_ui_language: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          credits?: number
          email?: string | null
          id: string
          plan?: string
          preferred_ui_language?: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          credits?: number
          email?: string | null
          id?: string
          plan?: string
          preferred_ui_language?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      project_slides: {
        Row: {
          attempt_count: number
          config: Json | null
          created_at: string
          emphasis: string | null
          generation_ms: number | null
          headline: string | null
          id: string
          image_url: string | null
          importance: string | null
          last_error: string | null
          objective: string | null
          project_id: string
          quality_score: number | null
          raw_screen_tag: string | null
          slide_number: number
          status: string
          subheadline: string | null
        }
        Insert: {
          attempt_count?: number
          config?: Json | null
          created_at?: string
          emphasis?: string | null
          generation_ms?: number | null
          headline?: string | null
          id?: string
          image_url?: string | null
          importance?: string | null
          last_error?: string | null
          objective?: string | null
          project_id: string
          quality_score?: number | null
          raw_screen_tag?: string | null
          slide_number: number
          status?: string
          subheadline?: string | null
        }
        Update: {
          attempt_count?: number
          config?: Json | null
          created_at?: string
          emphasis?: string | null
          generation_ms?: number | null
          headline?: string | null
          id?: string
          image_url?: string | null
          importance?: string | null
          last_error?: string | null
          objective?: string | null
          project_id?: string
          quality_score?: number | null
          raw_screen_tag?: string | null
          slide_number?: number
          status?: string
          subheadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_slides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_translations: {
        Row: {
          created_at: string
          device_format: string
          id: string
          project_id: string
          slide_number: number
          source_language: string
          storage_path: string
          target_language: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_format?: string
          id?: string
          project_id: string
          slide_number: number
          source_language?: string
          storage_path: string
          target_language: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_format?: string
          id?: string
          project_id?: string
          slide_number?: number
          source_language?: string
          storage_path?: string
          target_language?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_translations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_translations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          app_description: string | null
          app_name: string | null
          brand_kit: Json | null
          config: Json | null
          consistency_level: string | null
          created_at: string
          device_formats: Json | null
          generation_mode: string | null
          id: string
          name: string
          output_language: string
          platform: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_description?: string | null
          app_name?: string | null
          brand_kit?: Json | null
          config?: Json | null
          consistency_level?: string | null
          created_at?: string
          device_formats?: Json | null
          generation_mode?: string | null
          id?: string
          name: string
          output_language?: string
          platform?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_description?: string | null
          app_name?: string | null
          brand_kit?: Json | null
          config?: Json | null
          consistency_level?: string | null
          created_at?: string
          device_formats?: Json | null
          generation_mode?: string | null
          id?: string
          name?: string
          output_language?: string
          platform?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          template_name: string
          visual_summary: string | null
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          template_name: string
          visual_summary?: string | null
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          template_name?: string
          visual_summary?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_credits: {
        Args: { p_amount: number; p_cap?: number; p_user_id: string }
        Returns: number
      }
      debit_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      match_templates: {
        Args: {
          match_limit?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          metadata: Json
          similarity: number
          template_name: string
          visual_summary: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
