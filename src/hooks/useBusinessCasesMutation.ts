import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BusinessCaseInput {
  job_id: string;
  question_number: number;
  question_title: string;
  question_description: string;
  video_url?: string | null;
  has_text_response: boolean;
}

export function useJobBusinessCases(jobId: string | undefined) {
  return useQuery({
    queryKey: ['business-cases', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('business_cases')
        .select('*')
        .eq('job_id', jobId)
        .order('question_number', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });
}

export function useCreateBusinessCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: BusinessCaseInput) => {
      const { data, error } = await supabase
        .from('business_cases')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-cases', variables.job_id] });
      toast({ title: 'Question added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add question', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBusinessCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: BusinessCaseInput & { id: string }) => {
      const { data, error } = await supabase
        .from('business_cases')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-cases', variables.job_id] });
      toast({ title: 'Question updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update question', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBusinessCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, jobId }: { id: string; jobId: string }) => {
      const { error } = await supabase.from('business_cases').delete().eq('id', id);
      if (error) throw error;
      return { jobId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-cases', data.jobId] });
      toast({ title: 'Question deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete question', description: error.message, variant: 'destructive' });
    },
  });
}
