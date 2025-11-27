import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RecruiterNote {
  id: string;
  application_id: string;
  recruiter_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export function useRecruiterNotes(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['recruiter-notes', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('recruiter_notes')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RecruiterNote[];
    },
    enabled: !!applicationId,
  });
}

export function useAddRecruiterNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ applicationId, noteText }: { applicationId: string; noteText: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('recruiter_notes')
        .insert({
          application_id: applicationId,
          recruiter_id: user.id,
          note_text: noteText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-notes', variables.applicationId] });
    },
  });
}

export function useDeleteRecruiterNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, applicationId }: { noteId: string; applicationId: string }) => {
      const { error } = await supabase
        .from('recruiter_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return { applicationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-notes', data.applicationId] });
    },
  });
}
