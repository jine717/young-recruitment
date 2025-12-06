import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIEvaluation {
  id: string;
  application_id: string;
  overall_score: number | null;
  summary: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
  recommendation: 'proceed' | 'review' | 'reject' | null;
  cultural_fit_score: number | null;
  skills_match_score: number | null;
  communication_score: number | null;
  raw_response: unknown;
  created_at: string;
  // Pre-interview scores (preserved when interview analysis is run)
  initial_overall_score: number | null;
  initial_skills_match_score: number | null;
  initial_communication_score: number | null;
  initial_cultural_fit_score: number | null;
  initial_recommendation: string | null;
  evaluation_stage: 'initial' | 'post_interview';
}

export function useAIEvaluation(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['ai-evaluation', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      
      const { data, error } = await supabase
        .from('ai_evaluations')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (error) throw error;
      return data as AIEvaluation | null;
    },
    enabled: !!applicationId,
  });
}

export function useAIEvaluations(applicationIds: string[]) {
  return useQuery({
    queryKey: ['ai-evaluations', applicationIds],
    queryFn: async () => {
      if (applicationIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('ai_evaluations')
        .select('*')
        .in('application_id', applicationIds);

      if (error) throw error;
      return (data || []) as AIEvaluation[];
    },
    enabled: applicationIds.length > 0,
  });
}

export function useTriggerAIAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-candidate', {
        body: { applicationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-evaluation', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
