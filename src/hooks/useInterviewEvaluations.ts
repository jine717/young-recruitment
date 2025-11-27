import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InterviewEvaluation {
  id: string;
  application_id: string;
  evaluator_id: string;
  interview_date: string;
  technical_score: number | null;
  communication_score: number | null;
  cultural_fit_score: number | null;
  problem_solving_score: number | null;
  overall_impression: string | null;
  strengths: string[];
  areas_for_improvement: string[];
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | null;
  created_at: string;
  updated_at: string;
}

export function useInterviewEvaluations(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['interview-evaluations', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('interview_evaluations')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InterviewEvaluation[];
    },
    enabled: !!applicationId,
  });
}

export function useAddInterviewEvaluation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (evaluation: {
      applicationId: string;
      interviewDate: string;
      technicalScore: number;
      communicationScore: number;
      culturalFitScore: number;
      problemSolvingScore: number;
      overallImpression: string;
      strengths: string[];
      areasForImprovement: string[];
      recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('interview_evaluations')
        .insert({
          application_id: evaluation.applicationId,
          evaluator_id: user.id,
          interview_date: evaluation.interviewDate,
          technical_score: evaluation.technicalScore,
          communication_score: evaluation.communicationScore,
          cultural_fit_score: evaluation.culturalFitScore,
          problem_solving_score: evaluation.problemSolvingScore,
          overall_impression: evaluation.overallImpression,
          strengths: evaluation.strengths,
          areas_for_improvement: evaluation.areasForImprovement,
          recommendation: evaluation.recommendation,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interview-evaluations', variables.applicationId] });
    },
  });
}

export function useDeleteInterviewEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evaluationId, applicationId }: { evaluationId: string; applicationId: string }) => {
      const { error } = await supabase
        .from('interview_evaluations')
        .delete()
        .eq('id', evaluationId);

      if (error) throw error;
      return { applicationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-evaluations', data.applicationId] });
    },
  });
}
