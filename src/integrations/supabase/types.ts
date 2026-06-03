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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anamneses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          catalog_version: string | null
          clinical_flags: string[]
          completion_score: number | null
          created_at: string
          created_by: string | null
          data: Json
          id: string
          nutritionist_id: string | null
          origin: string
          patient_id: string
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          schema_version: number
          status: string
          submitted_at: string | null
          supersedes_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          catalog_version?: string | null
          clinical_flags?: string[]
          completion_score?: number | null
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          nutritionist_id?: string | null
          origin?: string
          patient_id: string
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          schema_version?: number
          status?: string
          submitted_at?: string | null
          supersedes_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          catalog_version?: string | null
          clinical_flags?: string[]
          completion_score?: number | null
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          nutritionist_id?: string | null
          origin?: string
          patient_id?: string
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          schema_version?: number
          status?: string
          submitted_at?: string | null
          supersedes_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "anamneses"
            referencedColumns: ["id"]
          },
        ]
      }
      food_household_measures: {
        Row: {
          created_at: string
          display_order: number
          food_id: string
          grams_equivalent: number
          id: string
          is_default: boolean
          measure_name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          food_id: string
          grams_equivalent: number
          id?: string
          is_default?: boolean
          measure_name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          food_id?: string
          grams_equivalent?: number
          id?: string
          is_default?: boolean
          measure_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_household_measures_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          carb_g: number
          category: string
          created_at: string
          default_qty: number
          default_unit: string
          fat_g: number
          fiber_g: number
          food_key: string | null
          id: string
          is_fodmap_safe: boolean
          is_gastrite_safe: boolean
          is_gluten_free: boolean
          is_lactose_free: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          kcal_per_100g: number
          name: string
          protein_g: number
          scale_group: Database["public"]["Enums"]["food_scale_group"]
          source: Database["public"]["Enums"]["food_source"]
          source_ref: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          carb_g?: number
          category: string
          created_at?: string
          default_qty?: number
          default_unit?: string
          fat_g?: number
          fiber_g?: number
          food_key?: string | null
          id?: string
          is_fodmap_safe?: boolean
          is_gastrite_safe?: boolean
          is_gluten_free?: boolean
          is_lactose_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          kcal_per_100g: number
          name: string
          protein_g?: number
          scale_group: Database["public"]["Enums"]["food_scale_group"]
          source?: Database["public"]["Enums"]["food_source"]
          source_ref?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          carb_g?: number
          category?: string
          created_at?: string
          default_qty?: number
          default_unit?: string
          fat_g?: number
          fiber_g?: number
          food_key?: string | null
          id?: string
          is_fodmap_safe?: boolean
          is_gastrite_safe?: boolean
          is_gluten_free?: boolean
          is_lactose_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          kcal_per_100g?: number
          name?: string
          protein_g?: number
          scale_group?: Database["public"]["Enums"]["food_scale_group"]
          source?: Database["public"]["Enums"]["food_source"]
          source_ref?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          schema_version: number
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          schema_version?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          schema_version?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      landing_leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          source: string
          user_agent: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          source?: string
          user_agent?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          source?: string
          user_agent?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      nutritionist_subscriptions: {
        Row: {
          created_at: string
          currency: string
          ends_at: string | null
          id: string
          monthly_price_cents: number
          notes: string | null
          nutritionist_id: string
          payment_method:
            | Database["public"]["Enums"]["subscription_payment_method"]
            | null
          plan_tier: Database["public"]["Enums"]["nutritionist_plan_tier"]
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          ends_at?: string | null
          id?: string
          monthly_price_cents: number
          notes?: string | null
          nutritionist_id: string
          payment_method?:
            | Database["public"]["Enums"]["subscription_payment_method"]
            | null
          plan_tier?: Database["public"]["Enums"]["nutritionist_plan_tier"]
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          ends_at?: string | null
          id?: string
          monthly_price_cents?: number
          notes?: string | null
          nutritionist_id?: string
          payment_method?:
            | Database["public"]["Enums"]["subscription_payment_method"]
            | null
          plan_tier?: Database["public"]["Enums"]["nutritionist_plan_tier"]
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutritionist_subscriptions_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      nutritionists: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          crn: string | null
          display_name: string | null
          email: string
          feedback_frequency_days: number
          full_name: string
          id: string
          phone: string | null
          public_bio: string | null
          public_headline: string | null
          slug: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          crn?: string | null
          display_name?: string | null
          email: string
          feedback_frequency_days?: number
          full_name: string
          id?: string
          phone?: string | null
          public_bio?: string | null
          public_headline?: string | null
          slug?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          crn?: string | null
          display_name?: string | null
          email?: string
          feedback_frequency_days?: number
          full_name?: string
          id?: string
          phone?: string | null
          public_bio?: string | null
          public_headline?: string | null
          slug?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_consents: {
        Row: {
          accepted_at: string
          anamnesis_id: string | null
          consent_type: string
          consent_version: string
          id: string
          ip_address: unknown
          patient_id: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          anamnesis_id?: string | null
          consent_type: string
          consent_version: string
          id?: string
          ip_address?: unknown
          patient_id: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          anamnesis_id?: string | null
          consent_type?: string
          consent_version?: string
          id?: string
          ip_address?: unknown
          patient_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_anamnesis_id_fkey"
            columns: ["anamnesis_id"]
            isOneToOne: false
            referencedRelation: "anamneses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_feedbacks: {
        Row: {
          abdomen_cm: number | null
          adherence_rating: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          edited_by: string | null
          height_cm_snapshot: number | null
          hip_cm: number | null
          id: string
          notes: string | null
          nutritionist_id: string
          patient_id: string
          photo_back_path: string | null
          photo_front_path: string | null
          photo_side_path: string | null
          result_rating: string | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          abdomen_cm?: number | null
          adherence_rating: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          height_cm_snapshot?: number | null
          hip_cm?: number | null
          id?: string
          notes?: string | null
          nutritionist_id: string
          patient_id: string
          photo_back_path?: string | null
          photo_front_path?: string | null
          photo_side_path?: string | null
          result_rating?: string | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          abdomen_cm?: number | null
          adherence_rating?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          height_cm_snapshot?: number | null
          hip_cm?: number | null
          id?: string
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string
          photo_back_path?: string | null
          photo_front_path?: string | null
          photo_side_path?: string | null
          result_rating?: string | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_feedbacks_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_feedbacks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_subscriptions: {
        Row: {
          created_at: string
          currency: string
          ends_at: string | null
          id: string
          notes: string | null
          nutritionist_id: string
          patient_id: string
          payment_method:
            | Database["public"]["Enums"]["subscription_payment_method"]
            | null
          plan_kind: Database["public"]["Enums"]["subscription_plan_kind"]
          price_cents: number
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          nutritionist_id: string
          patient_id: string
          payment_method?:
            | Database["public"]["Enums"]["subscription_payment_method"]
            | null
          plan_kind: Database["public"]["Enums"]["subscription_plan_kind"]
          price_cents: number
          starts_at: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string
          payment_method?:
            | Database["public"]["Enums"]["subscription_payment_method"]
            | null
          plan_kind?: Database["public"]["Enums"]["subscription_plan_kind"]
          price_cents?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_subscriptions_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_subscriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          height_cm: number | null
          id: string
          nutritionist_id: string
          onboarding_completed_at: string | null
          onboarding_version: number | null
          phone: string | null
          source_legacy_id: string | null
          source_referral_code: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          height_cm?: number | null
          id?: string
          nutritionist_id: string
          onboarding_completed_at?: string | null
          onboarding_version?: number | null
          phone?: string | null
          source_legacy_id?: string | null
          source_referral_code?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          height_cm?: number | null
          id?: string
          nutritionist_id?: string
          onboarding_completed_at?: string | null
          onboarding_version?: number | null
          phone?: string | null
          source_legacy_id?: string | null
          source_referral_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          nutritionist_id: string | null
          patient_id: string
          published_at: string | null
          schema_version: number
          snapshot: Json
          source_template_id: string | null
          source_template_key: string | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nutritionist_id?: string | null
          patient_id: string
          published_at?: string | null
          schema_version?: number
          snapshot: Json
          source_template_id?: string | null
          source_template_key?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nutritionist_id?: string | null
          patient_id?: string
          published_at?: string | null
          schema_version?: number
          snapshot?: Json
          source_template_id?: string | null
          source_template_key?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          nutritionist_id: string
          status: Database["public"]["Enums"]["referral_code_status"]
        }
        Insert: {
          code: string
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          nutritionist_id: string
          status?: Database["public"]["Enums"]["referral_code_status"]
        }
        Update: {
          code?: string
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          nutritionist_id?: string
          status?: Database["public"]["Enums"]["referral_code_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_consumed_by_fkey"
            columns: ["consumed_by"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          carb_g_target: number | null
          constraints_tags: string[]
          content: Json
          created_at: string
          fat_g_target: number | null
          goal_tag: string | null
          id: string
          kcal_range_max: number | null
          kcal_range_min: number | null
          kcal_target: number | null
          meals_per_day: number | null
          name: string
          nutritionist_id: string
          protein_g_target: number | null
          schema_version: number
          updated_at: string
        }
        Insert: {
          carb_g_target?: number | null
          constraints_tags?: string[]
          content: Json
          created_at?: string
          fat_g_target?: number | null
          goal_tag?: string | null
          id?: string
          kcal_range_max?: number | null
          kcal_range_min?: number | null
          kcal_target?: number | null
          meals_per_day?: number | null
          name: string
          nutritionist_id: string
          protein_g_target?: number | null
          schema_version?: number
          updated_at?: string
        }
        Update: {
          carb_g_target?: number | null
          constraints_tags?: string[]
          content?: Json
          created_at?: string
          fat_g_target?: number | null
          goal_tag?: string | null
          id?: string
          kcal_range_max?: number | null
          kcal_range_min?: number | null
          kcal_target?: number | null
          meals_per_day?: number | null
          name?: string
          nutritionist_id?: string
          protein_g_target?: number | null
          schema_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orphan_auth_users"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
    }
    Views: {
      orphan_auth_users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_orphan_auth_user: {
        Args: { _auth_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      patient_keeps_existing_nutritionist_link: {
        Args: { _nutritionist_id: string; _patient_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      food_scale_group:
        | "protein"
        | "carb"
        | "fat"
        | "fruit"
        | "vegetable"
        | "dairy"
        | "beverage"
        | "mixed"
      food_source: "taco" | "ibge" | "custom"
      nutritionist_plan_tier: "basic" | "pro"
      plan_status: "draft" | "published" | "archived"
      referral_code_status: "active" | "consumed" | "revoked" | "expired"
      subscription_payment_method:
        | "pix"
        | "card"
        | "cash"
        | "transfer"
        | "boleto"
        | "other"
      subscription_plan_kind:
        | "monthly"
        | "quarterly"
        | "semiannual"
        | "annual"
        | "custom"
      subscription_status: "active" | "paused" | "expired" | "cancelled"
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
      app_role: ["admin", "user"],
      food_scale_group: [
        "protein",
        "carb",
        "fat",
        "fruit",
        "vegetable",
        "dairy",
        "beverage",
        "mixed",
      ],
      food_source: ["taco", "ibge", "custom"],
      nutritionist_plan_tier: ["basic", "pro"],
      plan_status: ["draft", "published", "archived"],
      referral_code_status: ["active", "consumed", "revoked", "expired"],
      subscription_payment_method: [
        "pix",
        "card",
        "cash",
        "transfer",
        "boleto",
        "other",
      ],
      subscription_plan_kind: [
        "monthly",
        "quarterly",
        "semiannual",
        "annual",
        "custom",
      ],
      subscription_status: ["active", "paused", "expired", "cancelled"],
    },
  },
} as const
