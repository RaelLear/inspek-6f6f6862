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
      dashboard_layout: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          contact1_name: string | null
          contact1_phone: string | null
          contact2_name: string | null
          contact2_phone: string | null
          created_at: string
          employee_name: string
          id: string
          inspected: boolean
          role: string
          sector: string
          spreadsheet_id: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          contact1_name?: string | null
          contact1_phone?: string | null
          contact2_name?: string | null
          contact2_phone?: string | null
          created_at?: string
          employee_name: string
          id?: string
          inspected?: boolean
          role?: string
          sector?: string
          spreadsheet_id: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          contact1_name?: string | null
          contact1_phone?: string | null
          contact2_name?: string | null
          contact2_phone?: string | null
          created_at?: string
          employee_name?: string
          id?: string
          inspected?: boolean
          role?: string
          sector?: string
          spreadsheet_id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "emergency_spreadsheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_light_inspections: {
        Row: {
          auto_activation_desc: string | null
          auto_activation_status: string
          charge_signal_desc: string | null
          charge_signal_status: string
          created_at: string
          id: string
          inspection_date: string
          physical_state_desc: string | null
          physical_state_status: string
          positioning_desc: string | null
          positioning_status: string
          sector: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          auto_activation_desc?: string | null
          auto_activation_status?: string
          charge_signal_desc?: string | null
          charge_signal_status?: string
          created_at?: string
          id?: string
          inspection_date: string
          physical_state_desc?: string | null
          physical_state_status?: string
          positioning_desc?: string | null
          positioning_status?: string
          sector: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          auto_activation_desc?: string | null
          auto_activation_status?: string
          charge_signal_desc?: string | null
          charge_signal_status?: string
          created_at?: string
          id?: string
          inspection_date?: string
          physical_state_desc?: string | null
          physical_state_status?: string
          positioning_desc?: string | null
          positioning_status?: string
          sector?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_light_inspections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_spreadsheets: {
        Row: {
          created_at: string
          expires_at: string
          file_name: string
          id: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          file_name?: string
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          file_name?: string
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_spreadsheets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      extinguishers: {
        Row: {
          code: string
          created_at: string
          id: string
          port: string
          review_return_date: string | null
          review_send_date: string | null
          status: string
          team_id: string | null
          third_level: string | null
          type: string
          updated_at: string
          user_id: string | null
          warranty_expiry: string | null
          weight: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          port: string
          review_return_date?: string | null
          review_send_date?: string | null
          status?: string
          team_id?: string | null
          third_level?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          warranty_expiry?: string | null
          weight?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          port?: string
          review_return_date?: string | null
          review_send_date?: string | null
          status?: string
          team_id?: string | null
          third_level?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          warranty_expiry?: string | null
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "extinguishers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_schedules: {
        Row: {
          created_at: string
          frequency: string
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          module: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          code: string
          created_at: string
          extinguisher_id: string
          floor_paint_description: string | null
          floor_paint_status: string
          id: string
          inspection_date: string
          manometer_review_date: string | null
          manometer_status: string
          plate_description: string | null
          plate_status: string
          port: string
          review_return_date: string | null
          seal_review_date: string | null
          seal_status: string
          team_id: string | null
          third_level: string | null
          user_id: string | null
          warranty_expiry: string | null
        }
        Insert: {
          code: string
          created_at?: string
          extinguisher_id: string
          floor_paint_description?: string | null
          floor_paint_status?: string
          id?: string
          inspection_date: string
          manometer_review_date?: string | null
          manometer_status?: string
          plate_description?: string | null
          plate_status?: string
          port: string
          review_return_date?: string | null
          seal_review_date?: string | null
          seal_status?: string
          team_id?: string | null
          third_level?: string | null
          user_id?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          extinguisher_id?: string
          floor_paint_description?: string | null
          floor_paint_status?: string
          id?: string
          inspection_date?: string
          manometer_review_date?: string | null
          manometer_status?: string
          plate_description?: string | null
          plate_status?: string
          port?: string
          review_return_date?: string | null
          seal_review_date?: string | null
          seal_status?: string
          team_id?: string | null
          third_level?: string | null
          user_id?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_extinguisher_id_fkey"
            columns: ["extinguisher_id"]
            isOneToOne: false
            referencedRelation: "extinguishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_action_timeline: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          inspection_id: string
          responsible: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          inspection_id: string
          responsible?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          inspection_id?: string
          responsible?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_action_timeline_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "machine_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_inspection_records: {
        Row: {
          created_at: string
          current_situation: string | null
          id: string
          inspection_id: string
          photo_expires_at: string | null
          photo_url: string | null
          recommendations: string | null
          record_number: number
        }
        Insert: {
          created_at?: string
          current_situation?: string | null
          id?: string
          inspection_id: string
          photo_expires_at?: string | null
          photo_url?: string | null
          recommendations?: string | null
          record_number?: number
        }
        Update: {
          created_at?: string
          current_situation?: string | null
          id?: string
          inspection_id?: string
          photo_expires_at?: string | null
          photo_url?: string | null
          recommendations?: string | null
          record_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_inspection_records_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "machine_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_inspections: {
        Row: {
          brand: string | null
          capacity: string | null
          created_at: string
          equipment_name: string
          id: string
          identification: string | null
          inspection_date: string
          manufacture_year: string | null
          model: string | null
          port: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          capacity?: string | null
          created_at?: string
          equipment_name: string
          id?: string
          identification?: string | null
          inspection_date: string
          manufacture_year?: string | null
          model?: string | null
          port?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          capacity?: string | null
          created_at?: string
          equipment_name?: string
          id?: string
          identification?: string | null
          inspection_date?: string
          manufacture_year?: string | null
          model?: string | null
          port?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_inspections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          number: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          number: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          number?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          username?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          permanent: boolean
          status: string
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permanent?: boolean
          status?: string
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permanent?: boolean
          status?: string
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          notify_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          notify_date?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          notify_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          can_inspect: boolean
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          can_inspect?: boolean
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          can_inspect?: boolean
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
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
