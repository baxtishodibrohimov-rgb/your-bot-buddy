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
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          telegram_id: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          telegram_id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          admin_note: string | null
          appointment_at: string | null
          created_at: string
          full_name: string
          id: string
          notes: string | null
          patient_id: string | null
          phone: string
          reminder_sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          appointment_at?: string | null
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          phone: string
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          appointment_at?: string | null
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          phone?: string
          reminder_sent_at?: string | null
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
      broadcasts: {
        Row: {
          completed_at: string | null
          created_at: string
          failed_count: number
          id: string
          language_filter: string | null
          message_text: string
          sent_by_admin_id: string | null
          sent_by_telegram_id: number
          sent_count: number
          status: string
          total_recipients: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          failed_count?: number
          id?: string
          language_filter?: string | null
          message_text: string
          sent_by_admin_id?: string | null
          sent_by_telegram_id: number
          sent_count?: number
          status?: string
          total_recipients?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          failed_count?: number
          id?: string
          language_filter?: string | null
          message_text?: string
          sent_by_admin_id?: string | null
          sent_by_telegram_id?: number
          sent_count?: number
          status?: string
          total_recipients?: number
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_sent_by_admin_id_fkey"
            columns: ["sent_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_completions: {
        Row: {
          checklist_id: string
          completion_date: string
          id: string
          is_done: boolean
          item_id: string
          marked_at: string
          staff_id: string
        }
        Insert: {
          checklist_id: string
          completion_date?: string
          id?: string
          is_done?: boolean
          item_id: string
          marked_at?: string
          staff_id: string
        }
        Update: {
          checklist_id?: string
          completion_date?: string
          id?: string
          is_done?: boolean
          item_id?: string
          marked_at?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "staff_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          sort_order: number
          text: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          sort_order?: number
          text: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "staff_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_reviews: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          reject_reason: string | null
          review_date: string
          reviewed_at: string | null
          reviewed_by_coordinator_id: string | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          reject_reason?: string | null
          review_date?: string
          reviewed_at?: string | null
          reviewed_by_coordinator_id?: string | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          reject_reason?: string | null
          review_date?: string
          reviewed_at?: string | null
          reviewed_by_coordinator_id?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_reviews_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "staff_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_reviews_reviewed_by_coordinator_id_fkey"
            columns: ["reviewed_by_coordinator_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
      lab_appliance_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      lab_doctors: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      lab_order_media: {
        Row: {
          caption_override: string | null
          created_at: string
          id: string
          kind: string
          media_id: string
          order_id: string
          sort_order: number
        }
        Insert: {
          caption_override?: string | null
          created_at?: string
          id?: string
          kind: string
          media_id: string
          order_id: string
          sort_order?: number
        }
        Update: {
          caption_override?: string | null
          created_at?: string
          id?: string
          kind?: string
          media_id?: string
          order_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lab_order_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_order_media_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          accepted_at: string | null
          accepted_by_lab_worker_id: string | null
          appliance_name: string
          appliance_type_id: string | null
          completed_at: string | null
          created_at: string
          created_by_coord_staff_id: string | null
          created_by_telegram_id: number
          doctor_id: string | null
          doctor_name: string
          id: string
          notes: string | null
          patient_full_name: string
          ready_due_date: string | null
          reject_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_lab_worker_id?: string | null
          appliance_name: string
          appliance_type_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_coord_staff_id?: string | null
          created_by_telegram_id: number
          doctor_id?: string | null
          doctor_name: string
          id?: string
          notes?: string | null
          patient_full_name: string
          ready_due_date?: string | null
          reject_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_lab_worker_id?: string | null
          appliance_name?: string
          appliance_type_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_coord_staff_id?: string | null
          created_by_telegram_id?: number
          doctor_id?: string | null
          doctor_name?: string
          id?: string
          notes?: string | null
          patient_full_name?: string
          ready_due_date?: string | null
          reject_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_accepted_by_lab_worker_id_fkey"
            columns: ["accepted_by_lab_worker_id"]
            isOneToOne: false
            referencedRelation: "lab_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_appliance_type_id_fkey"
            columns: ["appliance_type_id"]
            isOneToOne: false
            referencedRelation: "lab_appliance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "lab_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_workers: {
        Row: {
          added_by_admin_id: string | null
          added_by_telegram_id: number | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          telegram_id: number
        }
        Insert: {
          added_by_admin_id?: string | null
          added_by_telegram_id?: number | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          telegram_id: number
        }
        Update: {
          added_by_admin_id?: string | null
          added_by_telegram_id?: number | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lab_workers_added_by_admin_id_fkey"
            columns: ["added_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      media_attachments: {
        Row: {
          caption_override: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          media_id: string
          sort_order: number
        }
        Insert: {
          caption_override?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          media_id: string
          sort_order?: number
        }
        Update: {
          caption_override?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          media_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_attachments_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          caption: string | null
          created_at: string
          duration: number | null
          file_id: string
          file_name: string | null
          file_size: number | null
          file_type: string
          file_unique_id: string | null
          height: number | null
          id: string
          mime_type: string | null
          thumbnail_file_id: string | null
          uploaded_by_admin_id: string | null
          uploaded_by_telegram_id: number
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          duration?: number | null
          file_id: string
          file_name?: string | null
          file_size?: number | null
          file_type: string
          file_unique_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          thumbnail_file_id?: string | null
          uploaded_by_admin_id?: string | null
          uploaded_by_telegram_id: number
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          duration?: number | null
          file_id?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string
          file_unique_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          thumbnail_file_id?: string | null
          uploaded_by_admin_id?: string | null
          uploaded_by_telegram_id?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_uploaded_by_admin_id_fkey"
            columns: ["uploaded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
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
      resident_section_media: {
        Row: {
          caption_override: string | null
          created_at: string
          id: string
          media_id: string
          section_id: string
          sort_order: number
        }
        Insert: {
          caption_override?: string | null
          created_at?: string
          id?: string
          media_id: string
          section_id: string
          sort_order?: number
        }
        Update: {
          caption_override?: string | null
          created_at?: string
          id?: string
          media_id?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "resident_section_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_section_media_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resident_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_root: boolean
          parent_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_root?: boolean
          parent_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_root?: boolean
          parent_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resident_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_test_attempts: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          resident_id: string
          resident_telegram_id: number
          section_id: string
          selected_option_index: number
          test_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          resident_id: string
          resident_telegram_id: number
          section_id: string
          selected_option_index: number
          test_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          resident_id?: string
          resident_telegram_id?: number
          section_id?: string
          selected_option_index?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_test_attempts_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_test_attempts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resident_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "resident_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_tests: {
        Row: {
          created_at: string
          id: string
          options: Json
          question: string
          section_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json
          question: string
          section_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          question?: string
          section_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_tests_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resident_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          added_by_admin_id: string | null
          added_by_telegram_id: number | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          notes: string | null
          telegram_id: number
        }
        Insert: {
          added_by_admin_id?: string | null
          added_by_telegram_id?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          telegram_id: number
        }
        Update: {
          added_by_admin_id?: string | null
          added_by_telegram_id?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "residents_added_by_admin_id_fkey"
            columns: ["added_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
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
      staff: {
        Row: {
          bio_ru: string | null
          bio_uz: string | null
          created_at: string
          experience_years: number | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          photo_url: string | null
          position: Database["public"]["Enums"]["staff_position"]
          sort_order: number
          specialty_ru: string | null
          specialty_uz: string | null
          telegram_id: number
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
          phone?: string | null
          photo_url?: string | null
          position: Database["public"]["Enums"]["staff_position"]
          sort_order?: number
          specialty_ru?: string | null
          specialty_uz?: string | null
          telegram_id: number
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
          phone?: string | null
          photo_url?: string | null
          position?: Database["public"]["Enums"]["staff_position"]
          sort_order?: number
          specialty_ru?: string | null
          specialty_uz?: string | null
          telegram_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_checklists: {
        Row: {
          created_at: string
          id: string
          is_daily_required: boolean
          sort_order: number
          staff_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_daily_required?: boolean
          sort_order?: number
          staff_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_daily_required?: boolean
          sort_order?: number
          staff_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_checklists_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_day_starts: {
        Row: {
          id: string
          staff_id: string
          start_date: string
          started_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          start_date?: string
          started_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          start_date?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_day_starts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
      has_admin_role: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      staff_position:
        | "registratura"
        | "koordinator"
        | "shifokor"
        | "shifokor_yordamchisi"
        | "hisobchi"
        | "sterilizatsiya"
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
      staff_position: [
        "registratura",
        "koordinator",
        "shifokor",
        "shifokor_yordamchisi",
        "hisobchi",
        "sterilizatsiya",
      ],
    },
  },
} as const
