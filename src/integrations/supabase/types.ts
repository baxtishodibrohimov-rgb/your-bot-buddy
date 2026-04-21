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
      admins: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          telegram_id: number
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          telegram_id: number
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          telegram_id?: number
        }
        Relationships: []
      }
      appointments: {
        Row: {
          admin_note: string | null
          created_at: string
          full_name: string
          id: string
          notes: string | null
          patient_id: string | null
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_info: {
        Row: {
          about_ru: string
          about_uz: string
          address_ru: string
          address_uz: string
          id: number
          instagram: string | null
          location_url: string | null
          name_ru: string
          name_uz: string
          phone: string
          telegram_channel: string | null
          updated_at: string
          working_hours_ru: string
          working_hours_uz: string
        }
        Insert: {
          about_ru?: string
          about_uz?: string
          address_ru?: string
          address_uz?: string
          id?: number
          instagram?: string | null
          location_url?: string | null
          name_ru?: string
          name_uz?: string
          phone?: string
          telegram_channel?: string | null
          updated_at?: string
          working_hours_ru?: string
          working_hours_uz?: string
        }
        Update: {
          about_ru?: string
          about_uz?: string
          address_ru?: string
          address_uz?: string
          id?: number
          instagram?: string | null
          location_url?: string | null
          name_ru?: string
          name_uz?: string
          phone?: string
          telegram_channel?: string | null
          updated_at?: string
          working_hours_ru?: string
          working_hours_uz?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          patient_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          patient_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          patient_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio_ru: string | null
          bio_uz: string | null
          created_at: string
          experience_years: number | null
          full_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          sort_order: number
          specialty_ru: string
          specialty_uz: string
          updated_at: string
        }
        Insert: {
          bio_ru?: string | null
          bio_uz?: string | null
          created_at?: string
          experience_years?: number | null
          full_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          sort_order?: number
          specialty_ru: string
          specialty_uz: string
          updated_at?: string
        }
        Update: {
          bio_ru?: string | null
          bio_uz?: string | null
          created_at?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          sort_order?: number
          specialty_ru?: string
          specialty_uz?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_cards: {
        Row: {
          address: string | null
          allergies: string | null
          birth_date: string | null
          chronic_diseases: string | null
          created_at: string
          current_medications: string | null
          full_name: string | null
          gender: string | null
          id: string
          notes: string | null
          patient_id: string
          previous_treatments: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          chronic_diseases?: string | null
          created_at?: string
          current_medications?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          previous_treatments?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          chronic_diseases?: string | null
          created_at?: string
          current_medications?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          previous_treatments?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_cards_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          language: string
          last_name: string | null
          phone: string | null
          state: string | null
          state_data: Json | null
          telegram_id: number
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          language?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          state_data?: Json | null
          telegram_id: number
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          language?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          state_data?: Json | null
          telegram_id?: number
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description_ru: string | null
          description_uz: string | null
          id: string
          is_active: boolean
          name_ru: string
          name_uz: string
          price_from: number | null
          price_to: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ru?: string | null
          description_uz?: string | null
          id?: string
          is_active?: boolean
          name_ru: string
          name_uz: string
          price_from?: number | null
          price_to?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ru?: string | null
          description_uz?: string | null
          id?: string
          is_active?: boolean
          name_ru?: string
          name_uz?: string
          price_from?: number | null
          price_to?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          processed: boolean
          raw_update: Json
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          processed?: boolean
          raw_update: Json
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          processed?: boolean
          raw_update?: Json
          text?: string | null
          update_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
