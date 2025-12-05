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
      ai_evaluation_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          prompt_content: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          prompt_content: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          prompt_content?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          candidate_email: string | null
          candidate_id: string | null
          candidate_name: string | null
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
          candidate_email?: string | null
          candidate_id?: string | null
          candidate_name?: string | null
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
          candidate_email?: string | null
          candidate_id?: string | null
          candidate_name?: string | null
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
      candidate_comparisons: {
        Row: {
          application_ids: string[]
          comparison_result: Json | null
          created_at: string
          created_by: string
          evaluation_prompt: string | null
          id: string
          job_id: string
          status: string
        }
        Insert: {
          application_ids: string[]
          comparison_result?: Json | null
          created_at?: string
          created_by: string
          evaluation_prompt?: string | null
          id?: string
          job_id: string
          status?: string
        }
        Update: {
          application_ids?: string[]
          comparison_result?: Json | null
          created_at?: string
          created_by?: string
          evaluation_prompt?: string | null
          id?: string
          job_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_comparisons_job_id_fkey"
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
      document_analyses: {
        Row: {
          analysis: Json | null
          application_id: string
          created_at: string
          document_type: string
          error_message: string | null
          id: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          analysis?: Json | null
          application_id: string
          created_at?: string
          document_type: string
          error_message?: string | null
          id?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          analysis?: Json | null
          application_id?: string
          created_at?: string
          document_type?: string
          error_message?: string | null
          id?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_analyses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_decisions: {
        Row: {
          application_id: string
          created_at: string
          decision: Database["public"]["Enums"]["hiring_decision_type"]
          decision_maker_id: string
          id: string
          reasoning: string
          rejection_reason: string | null
          salary_offered: string | null
          start_date: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["hiring_decision_type"]
          decision_maker_id: string
          id?: string
          reasoning: string
          rejection_reason?: string | null
          salary_offered?: string | null
          start_date?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["hiring_decision_type"]
          decision_maker_id?: string
          id?: string
          reasoning?: string
          rejection_reason?: string | null
          salary_offered?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hiring_decisions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_evaluations: {
        Row: {
          application_id: string
          areas_for_improvement: string[] | null
          communication_score: number | null
          created_at: string
          cultural_fit_score: number | null
          evaluator_id: string
          id: string
          interview_date: string
          overall_impression: string | null
          problem_solving_score: number | null
          recommendation:
            | Database["public"]["Enums"]["interview_recommendation"]
            | null
          strengths: string[] | null
          technical_score: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          areas_for_improvement?: string[] | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          evaluator_id: string
          id?: string
          interview_date?: string
          overall_impression?: string | null
          problem_solving_score?: number | null
          recommendation?:
            | Database["public"]["Enums"]["interview_recommendation"]
            | null
          strengths?: string[] | null
          technical_score?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          areas_for_improvement?: string[] | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          evaluator_id?: string
          id?: string
          interview_date?: string
          overall_impression?: string | null
          problem_solving_score?: number | null
          recommendation?:
            | Database["public"]["Enums"]["interview_recommendation"]
            | null
          strengths?: string[] | null
          technical_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          application_id: string
          category: string
          created_at: string
          id: string
          priority: number
          question_text: string
          reasoning: string | null
          recruiter_note: string | null
        }
        Insert: {
          application_id: string
          category: string
          created_at?: string
          id?: string
          priority?: number
          question_text: string
          reasoning?: string | null
          recruiter_note?: string | null
        }
        Update: {
          application_id?: string
          category?: string
          created_at?: string
          id?: string
          priority?: number
          question_text?: string
          reasoning?: string | null
          recruiter_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          duration_minutes: number
          id: string
          internal_notes: string | null
          interview_date: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          location: string | null
          meeting_link: string | null
          notes_for_candidate: string | null
          scheduled_by: string
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          interview_date: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          location?: string | null
          meeting_link?: string | null
          notes_for_candidate?: string | null
          scheduled_by: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          interview_date?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          location?: string | null
          meeting_link?: string | null
          notes_for_candidate?: string | null
          scheduled_by?: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_fixed_questions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          job_id: string
          priority: number
          question_order: number
          question_text: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          job_id: string
          priority?: number
          question_order?: number
          question_text: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          job_id?: string
          priority?: number
          question_order?: number
          question_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_fixed_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          ai_interview_prompt: string | null
          ai_system_prompt: string | null
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
          ai_interview_prompt?: string | null
          ai_system_prompt?: string | null
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
          ai_interview_prompt?: string | null
          ai_system_prompt?: string | null
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
      notification_logs: {
        Row: {
          application_id: string
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          application_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          sent_at?: string
          status?: string
          subject: string
        }
        Update: {
          application_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
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
      recruiter_notes: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note_text: string
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note_text: string
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note_text?: string
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
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
      hiring_decision_type: "hired" | "rejected" | "on_hold"
      interview_recommendation:
        | "strong_hire"
        | "hire"
        | "no_hire"
        | "strong_no_hire"
      interview_status: "scheduled" | "completed" | "cancelled" | "rescheduled"
      interview_type: "phone" | "video" | "in_person"
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
      hiring_decision_type: ["hired", "rejected", "on_hold"],
      interview_recommendation: [
        "strong_hire",
        "hire",
        "no_hire",
        "strong_no_hire",
      ],
      interview_status: ["scheduled", "completed", "cancelled", "rescheduled"],
      interview_type: ["phone", "video", "in_person"],
      job_status: ["draft", "published", "closed"],
      job_type: ["full-time", "part-time", "contract", "internship"],
    },
  },
} as const
