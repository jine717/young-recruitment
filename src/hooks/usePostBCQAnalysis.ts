import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostBCQAnalysisResult {
  success: boolean;
  evaluation: {
    overall_score: number;
    skills_match_score: number;
    communication_score: number;
    cultural_fit_score: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    concerns: string[];
    score_change_explanation: {
      previous_score: number | null;
      new_score: number;
      change: number;
      reasons_for_change: string[];
    };
    previous_score: number | null;
  };
}

export function usePostBCQAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      customInstructions,
    }: {
      applicationId: string;
      customInstructions?: string;
    }): Promise<PostBCQAnalysisResult> => {
      const { data, error } = await supabase.functions.invoke('analyze-post-bcq', {
        body: { applicationId, customInstructions },
      });

      if (error) {
        console.error('Post-BCQ analysis error:', error);
        throw new Error(error.message || 'Failed to analyze candidate');
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['ai-evaluations'] });
      
      const scoreChange = data.evaluation.score_change_explanation;
      const changeText = scoreChange.change > 0 
        ? `+${scoreChange.change}` 
        : scoreChange.change.toString();
      
      toast.success('Analysis Complete', {
        description: `New score: ${data.evaluation.overall_score} (${changeText} from initial)`,
      });
    },
    onError: (error: Error) => {
      toast.error('Analysis Failed', {
        description: error.message,
      });
    },
  });
}
