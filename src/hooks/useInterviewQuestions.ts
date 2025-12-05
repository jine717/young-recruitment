import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InterviewQuestion {
  id: string;
  application_id: string;
  question_text: string;
  category: string;
  reasoning: string | null;
  recruiter_note: string | null;
  priority: number;
  created_at: string;
}

export interface CreateInterviewQuestion {
  application_id: string;
  question_text: string;
  category: string;
  reasoning?: string;
  priority: number;
}

export interface UpdateInterviewQuestion {
  id: string;
  question_text?: string;
  category?: string;
  reasoning?: string;
  recruiter_note?: string | null;
  priority?: number;
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

interface GenerateQuestionsInput {
  applicationId: string;
  customInstructions?: string;
}

export function useGenerateInterviewQuestions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId, customInstructions }: GenerateQuestionsInput) => {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: { applicationId, customInstructions },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions', applicationId] });
    },
  });
}

export function useCreateInterviewQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (question: CreateInterviewQuestion) => {
      const { data, error } = await supabase
        .from('interview_questions')
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return data as InterviewQuestion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions', data.application_id] });
    },
  });
}

export function useUpdateInterviewQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateInterviewQuestion) => {
      const { data, error } = await supabase
        .from('interview_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InterviewQuestion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions', data.application_id] });
    },
  });
}

export function useDeleteInterviewQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, applicationId }: { id: string; applicationId: string }) => {
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, applicationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions', data.applicationId] });
    },
  });
}
