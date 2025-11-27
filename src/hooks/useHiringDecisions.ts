import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HiringDecision {
  id: string;
  application_id: string;
  decision: 'hired' | 'rejected' | 'on_hold';
  decision_maker_id: string;
  reasoning: string;
  salary_offered: string | null;
  start_date: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export function useHiringDecisions(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['hiring-decisions', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('hiring_decisions')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as HiringDecision[];
    },
    enabled: !!applicationId,
  });
}

export function useAddHiringDecision() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (decision: {
      applicationId: string;
      decision: 'hired' | 'rejected' | 'on_hold';
      reasoning: string;
      salaryOffered?: string;
      startDate?: string;
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hiring_decisions')
        .insert({
          application_id: decision.applicationId,
          decision_maker_id: user.id,
          decision: decision.decision,
          reasoning: decision.reasoning,
          salary_offered: decision.salaryOffered || null,
          start_date: decision.startDate || null,
          rejection_reason: decision.rejectionReason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hiring-decisions', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-detail', variables.applicationId] });
    },
  });
}
