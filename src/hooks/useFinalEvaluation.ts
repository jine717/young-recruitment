import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinalEvaluation {
  final_overall_score: number;
  final_recommendation: 'hire' | 'proceed_with_caution' | 'reject';
  
  // Scores breakdown
  technical_competency: number;
  communication_skills: number;
  cultural_fit: number;
  problem_solving: number;
  leadership_potential: number;
  
  // Detailed analysis
  executive_summary: string;
  strengths_summary: string[];
  concerns_summary: string[];
  
  // Stage comparisons
  stage_progression: {
    initial_score: number | null;
    post_bcq_score: number | null;
    interview_score: number | null;
    final_score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  
  // Final thoughts
  hiring_recommendation: string;
  compensation_considerations: string;
  onboarding_suggestions: string[];
  risk_assessment: string;
}

interface FinalEvaluationResult {
  success: boolean;
  evaluation: FinalEvaluation;
}

export function useFinalEvaluation(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['final-evaluation', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;

      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('application_id', applicationId)
        .eq('document_type', 'final_evaluation')
        .maybeSingle();

      if (error) {
        console.error('Error fetching final evaluation:', error);
        return null;
      }

      return data ? {
        ...data,
        analysis: data.analysis as unknown as FinalEvaluation | null,
      } : null;
    },
    enabled: !!applicationId,
  });
}

export function useTriggerFinalEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      customInstructions,
    }: {
      applicationId: string;
      customInstructions?: string;
    }): Promise<FinalEvaluationResult> => {
      const { data, error } = await supabase.functions.invoke('analyze-final', {
        body: { applicationId, customInstructions },
      });

      if (error) {
        console.error('Final evaluation error:', error);
        throw new Error(error.message || 'Failed to run final evaluation');
      }

      if (!data.success) {
        throw new Error(data.error || 'Final evaluation failed');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['ai-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['final-evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['document-analyses'] });
      
      toast.success('Final Evaluation Complete', {
        description: `Final score: ${data.evaluation.final_overall_score}/100 - ${data.evaluation.final_recommendation.replace('_', ' ')}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Final Evaluation Failed', {
        description: error.message,
      });
    },
  });
}
