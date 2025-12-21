import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InterviewAnalysis {
  interview_summary: string;
  performance_assessment: string;
  strengths_demonstrated: string[];
  concerns_identified: string[];
  areas_needing_clarification: string[];
  new_overall_score: number;
  new_skills_score: number;
  new_communication_score: number;
  new_cultural_fit_score: number;
  new_recommendation: 'proceed' | 'review' | 'reject';
  score_change_explanation: {
    previous_score: number;
    new_score: number;
    change: number;
    reasons_for_change: string[];
  };
  next_steps_recommendation: string;
  suggested_follow_up_questions: string[];
}

export interface InterviewAnalysisDocument {
  id: string;
  application_id: string;
  document_type: 'interview';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis: InterviewAnalysis | null;
  summary: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useInterviewAnalysis(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['interview-analysis', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('application_id', applicationId)
        .eq('document_type', 'interview')
        .maybeSingle();

      if (error) throw error;
      return data as unknown as InterviewAnalysisDocument | null;
    },
    enabled: !!applicationId,
  });
}

export function useTriggerInterviewAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId, customInstructions }: { 
      applicationId: string; 
      customInstructions?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-interview', {
        body: { applicationId, customInstructions },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Auto-transition: interview → interviewed after analysis
      await supabase
        .from('applications')
        .update({ status: 'interviewed' })
        .eq('id', applicationId);

      return data;
    },
    onSuccess: (_, { applicationId }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['interview-analysis', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-evaluation', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['document-analyses', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
