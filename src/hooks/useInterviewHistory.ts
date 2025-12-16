import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InterviewHistoryEntry {
  id: string;
  interview_id: string;
  change_type: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
  previous_date: string | null;
  new_date: string | null;
  previous_type: string | null;
  new_type: string | null;
  changed_by: string;
  notes: string | null;
  created_at: string;
}

export function useInterviewHistory(interviewId: string | undefined) {
  return useQuery({
    queryKey: ['interview-history', interviewId],
    queryFn: async () => {
      if (!interviewId) return [];

      const { data, error } = await supabase
        .from('interview_schedule_history')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as InterviewHistoryEntry[];
    },
    enabled: !!interviewId,
  });
}

export function useLogInterviewHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interviewId,
      changeType,
      previousDate,
      newDate,
      previousType,
      newType,
      notes,
    }: {
      interviewId: string;
      changeType: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
      previousDate?: string | null;
      newDate?: string | null;
      previousType?: string | null;
      newType?: string | null;
      notes?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('interview_schedule_history')
        .insert({
          interview_id: interviewId,
          change_type: changeType,
          previous_date: previousDate || null,
          new_date: newDate || null,
          previous_type: previousType || null,
          new_type: newType || null,
          changed_by: user.id,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interview-history', variables.interviewId] });
    },
  });
}
