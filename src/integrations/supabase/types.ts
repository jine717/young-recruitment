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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_evaluations: {
        Row: {
          application_id: string
          communication_score: number | null
          concerns: string[] | null
          created_at: string
          cultural_fit_score: number | null
          id: string
          overall_score: number | null
          raw_response: Json | null
          recommendation:
            | Database["public"]["Enums"]["ai_recommendation"]
            | null
          skills_match_score: number | null
          strengths: string[] | null
          summary: string | null
        }
        Insert: {
          application_id: string
          communication_score?: number | null
          concerns?: string[] | null
          created_at?: string
          cultural_fit_score?: number | null
          id?: string
          overall_score?: number | null
          raw_response?: Json | null
          recommendation?:
            | Database["public"]["Enums"]["ai_recommendation"]
            | null
          skills_match_score?: number | null
          strengths?: string[] | null
          summary?: string | null
        }
        Update: {
          application_id?: string
          communication_score?: number | null
          concerns?: string[] | null
          created_at?: string
          cultural_fit_score?: number | null
          id?: string
          overall_score?: number | null
          raw_response?: Json | null
          recommendation?:
            | Database["public"]["Enums"]["ai_recommendation"]
            | null
          skills_match_score?: number | null
          strengths?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_evaluation_status:
            | Database["public"]["Enums"]["ai_evaluation_status"]
            | null
          ai_score: number | null
          business_case_completed: boolean
          business_case_completed_at: string | null
          candidate_id: string
          created_at: string
          cv_url: string | null
          disc_url: string | null
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          ai_evaluation_status?:
            | Database["public"]["Enums"]["ai_evaluation_status"]
            | null
          ai_score?: number | null
          business_case_completed?: boolean
          business_case_completed_at?: string | null
          candidate_id: string
          created_at?: string
          cv_url?: string | null
          disc_url?: string | null
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          ai_evaluation_status?:
            | Database["public"]["Enums"]["ai_evaluation_status"]
            | null
          ai_score?: number | null
          business_case_completed?: boolean
          business_case_completed_at?: string | null
          candidate_id?: string
          created_at?: string
          cv_url?: string | null
          disc_url?: string | null
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_case_responses: {
        Row: {
          application_id: string
          business_case_id: string
          completed_at: string | null
          created_at: string
          id: string
          text_response: string | null
          video_url: string | null
        }
        Insert: {
          application_id: string
          business_case_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          text_response?: string | null
          video_url?: string | null
        }
        Update: {
          application_id?: string
          business_case_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          text_response?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_case_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_case_responses_business_case_id_fkey"
            columns: ["business_case_id"]
            isOneToOne: false
            referencedRelation: "business_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      business_cases: {
        Row: {
          created_at: string
          has_text_response: boolean
          id: string
          job_id: string
          question_description: string
          question_number: number
          question_title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          has_text_response?: boolean
          id?: string
          job_id: string
          question_description: string
          question_number: number
          question_title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          has_text_response?: boolean
          id?: string
          job_id?: string
          question_description?: string
          question_number?: number
          question_title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_cases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          benefits: string[] | null
          created_at: string
          department_id: string | null
          description: string
          id: string
          location: string
          requirements: string[] | null
          responsibilities: string[] | null
          status: Database["public"]["Enums"]["job_status"]
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          location: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          location?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_evaluation_status: "pending" | "processing" | "completed" | "failed"
      ai_recommendation: "proceed" | "review" | "reject"
      app_role: "candidate" | "recruiter" | "admin"
      application_status:
        | "pending"
        | "under_review"
        | "interview"
        | "rejected"
        | "hired"
      job_status: "draft" | "published" | "closed"
      job_type: "full-time" | "part-time" | "contract" | "internship"
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
      ai_evaluation_status: ["pending", "processing", "completed", "failed"],
      ai_recommendation: ["proceed", "review", "reject"],
      app_role: ["candidate", "recruiter", "admin"],
      application_status: [
        "pending",
        "under_review",
        "interview",
        "rejected",
        "hired",
      ],
      job_status: ["draft", "published", "closed"],
      job_type: ["full-time", "part-time", "contract", "internship"],
    },
  },
} as const
