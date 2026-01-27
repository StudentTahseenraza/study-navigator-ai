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
      ai_tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: number
          priority: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          university_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          priority?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          university_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          priority?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          university_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      locked_universities: {
        Row: {
          id: number
          locked_at: string | null
          notes: string | null
          university_id: number
          user_id: string
        }
        Insert: {
          id?: number
          locked_at?: string | null
          notes?: string | null
          university_id: number
          user_id: string
        }
        Update: {
          id?: number
          locked_at?: string | null
          notes?: string | null
          university_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locked_universities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          current_education_level: string | null
          current_stage: Database["public"]["Enums"]["user_stage"] | null
          degree_major: string | null
          email: string | null
          field_of_study: string | null
          full_name: string | null
          funding_plan: string | null
          gmat_score: number | null
          gmat_status: Database["public"]["Enums"]["exam_status"] | null
          gpa: number | null
          graduation_year: number | null
          gre_score: number | null
          gre_status: Database["public"]["Enums"]["exam_status"] | null
          id: string
          ielts_score: number | null
          ielts_status: Database["public"]["Enums"]["exam_status"] | null
          intended_degree: string | null
          onboarding_completed: boolean | null
          preferred_countries: string[] | null
          profile_strength: number | null
          sop_status: Database["public"]["Enums"]["sop_status"] | null
          target_intake_year: number | null
          toefl_score: number | null
          toefl_status: Database["public"]["Enums"]["exam_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          current_education_level?: string | null
          current_stage?: Database["public"]["Enums"]["user_stage"] | null
          degree_major?: string | null
          email?: string | null
          field_of_study?: string | null
          full_name?: string | null
          funding_plan?: string | null
          gmat_score?: number | null
          gmat_status?: Database["public"]["Enums"]["exam_status"] | null
          gpa?: number | null
          graduation_year?: number | null
          gre_score?: number | null
          gre_status?: Database["public"]["Enums"]["exam_status"] | null
          id?: string
          ielts_score?: number | null
          ielts_status?: Database["public"]["Enums"]["exam_status"] | null
          intended_degree?: string | null
          onboarding_completed?: boolean | null
          preferred_countries?: string[] | null
          profile_strength?: number | null
          sop_status?: Database["public"]["Enums"]["sop_status"] | null
          target_intake_year?: number | null
          toefl_score?: number | null
          toefl_status?: Database["public"]["Enums"]["exam_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          current_education_level?: string | null
          current_stage?: Database["public"]["Enums"]["user_stage"] | null
          degree_major?: string | null
          email?: string | null
          field_of_study?: string | null
          full_name?: string | null
          funding_plan?: string | null
          gmat_score?: number | null
          gmat_status?: Database["public"]["Enums"]["exam_status"] | null
          gpa?: number | null
          graduation_year?: number | null
          gre_score?: number | null
          gre_status?: Database["public"]["Enums"]["exam_status"] | null
          id?: string
          ielts_score?: number | null
          ielts_status?: Database["public"]["Enums"]["exam_status"] | null
          intended_degree?: string | null
          onboarding_completed?: boolean | null
          preferred_countries?: string[] | null
          profile_strength?: number | null
          sop_status?: Database["public"]["Enums"]["sop_status"] | null
          target_intake_year?: number | null
          toefl_score?: number | null
          toefl_status?: Database["public"]["Enums"]["exam_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          acceptance_rate: number | null
          application_deadline: string | null
          city: string | null
          country: string
          created_at: string | null
          description: string | null
          id: number
          intake_months: string[] | null
          logo_url: string | null
          min_gmat: number | null
          min_gpa: number | null
          min_gre: number | null
          min_ielts: number | null
          min_toefl: number | null
          name: string
          programs: string[] | null
          ranking: number | null
          requirements: string | null
          tuition_max: number | null
          tuition_min: number | null
          website_url: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          application_deadline?: string | null
          city?: string | null
          country: string
          created_at?: string | null
          description?: string | null
          id?: number
          intake_months?: string[] | null
          logo_url?: string | null
          min_gmat?: number | null
          min_gpa?: number | null
          min_gre?: number | null
          min_ielts?: number | null
          min_toefl?: number | null
          name: string
          programs?: string[] | null
          ranking?: number | null
          requirements?: string | null
          tuition_max?: number | null
          tuition_min?: number | null
          website_url?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          application_deadline?: string | null
          city?: string | null
          country?: string
          created_at?: string | null
          description?: string | null
          id?: number
          intake_months?: string[] | null
          logo_url?: string | null
          min_gmat?: number | null
          min_gpa?: number | null
          min_gre?: number | null
          min_ielts?: number | null
          min_toefl?: number | null
          name?: string
          programs?: string[] | null
          ranking?: number | null
          requirements?: string | null
          tuition_max?: number | null
          tuition_min?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      university_shortlist: {
        Row: {
          ai_reasoning: string | null
          category: Database["public"]["Enums"]["university_category"]
          created_at: string | null
          fit_score: number | null
          id: number
          risk_level: string | null
          university_id: number
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          category: Database["public"]["Enums"]["university_category"]
          created_at?: string | null
          fit_score?: number | null
          id?: number
          risk_level?: string | null
          university_id: number
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          category?: Database["public"]["Enums"]["university_category"]
          created_at?: string | null
          fit_score?: number | null
          id?: number
          risk_level?: string | null
          university_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_shortlist_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_profile_owner: { Args: { profile_user_id: string }; Returns: boolean }
    }
    Enums: {
      exam_status: "not_started" | "preparing" | "scheduled" | "completed"
      sop_status: "not_started" | "draft" | "ready"
      task_status: "pending" | "in_progress" | "completed"
      university_category: "dream" | "target" | "safe"
      user_stage:
        | "onboarding"
        | "profile_building"
        | "discovering"
        | "shortlisting"
        | "locked"
        | "applying"
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
      exam_status: ["not_started", "preparing", "scheduled", "completed"],
      sop_status: ["not_started", "draft", "ready"],
      task_status: ["pending", "in_progress", "completed"],
      university_category: ["dream", "target", "safe"],
      user_stage: [
        "onboarding",
        "profile_building",
        "discovering",
        "shortlisting",
        "locked",
        "applying",
      ],
    },
  },
} as const
