import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FixedQuestionNote {
  id: string;
  application_id: string;
  fixed_question_id: string;
  recruiter_id: string;
  note_text: string | null;
  created_at: string;
  updated_at: string;
}

export function useFixedQuestionNotes(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['fixed-question-notes', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('fixed_question_notes')
        .select('*')
        .eq('application_id', applicationId);

      if (error) throw error;
      return (data || []) as FixedQuestionNote[];
    },
    enabled: !!applicationId,
  });
}

export function useUpsertFixedQuestionNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      fixedQuestionId, 
      noteText 
    }: { 
      applicationId: string; 
      fixedQuestionId: string; 
      noteText: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('fixed_question_notes')
        .upsert({
          application_id: applicationId,
          fixed_question_id: fixedQuestionId,
          recruiter_id: userData.user.id,
          note_text: noteText,
        }, {
          onConflict: 'application_id,fixed_question_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data as FixedQuestionNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fixed-question-notes', data.application_id] });
    },
  });
}

export function useDeleteFixedQuestionNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, applicationId }: { id: string; applicationId: string }) => {
      const { error } = await supabase
        .from('fixed_question_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, applicationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fixed-question-notes', data.applicationId] });
    },
  });
}
