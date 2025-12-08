import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAssignApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, assignedTo }: { applicationId: string; assignedTo: string | null }) => {
      const { error } = await supabase
        .from('applications')
        .update({ assigned_to: assignedTo })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application assigned successfully');
    },
    onError: (error) => {
      console.error('Error assigning application:', error);
      toast.error('Failed to assign application');
    },
  });
}
