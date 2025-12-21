import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAnalyzeBCQResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responseId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-bcq-response', {
        body: { responseId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-case-responses'] });
      toast.success('Response analysis completed');
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze response');
    }
  });
}
