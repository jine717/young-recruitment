import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobFixedQuestionInput {
  job_id: string;
  question_text: string;
  category: string;
  priority: number;
  question_order: number;
}

export function useJobFixedQuestionsForEditor(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-fixed-questions-editor', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('job_fixed_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId,
  });
}

export function useCreateJobFixedQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (question: JobFixedQuestionInput) => {
      const { data, error } = await supabase
        .from('job_fixed_questions')
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-fixed-questions-editor', data.job_id] });
      queryClient.invalidateQueries({ queryKey: ['job-fixed-questions', data.job_id] });
    },
  });
}

export function useUpdateJobFixedQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<JobFixedQuestionInput>) => {
      const { data, error } = await supabase
        .from('job_fixed_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-fixed-questions-editor', data.job_id] });
      queryClient.invalidateQueries({ queryKey: ['job-fixed-questions', data.job_id] });
    },
  });
}

export function useDeleteJobFixedQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, jobId }: { id: string; jobId: string }) => {
      const { error } = await supabase
        .from('job_fixed_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, jobId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-fixed-questions-editor', data.jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-fixed-questions', data.jobId] });
    },
  });
}
