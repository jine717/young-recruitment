import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InterviewQuestion {
  id: string;
  application_id: string;
  question_text: string;
  category: string;
  reasoning: string | null;
  priority: number;
  created_at: string;
}

export function useInterviewQuestions(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['interview-questions', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('application_id', applicationId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as InterviewQuestion[];
    },
    enabled: !!applicationId,
  });
}

export function useGenerateInterviewQuestions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: { applicationId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions', applicationId] });
    },
  });
}
