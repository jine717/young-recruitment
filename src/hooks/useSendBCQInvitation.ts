import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendBCQInvitationParams {
  applicationId: string;
  bcqAccessToken: string;
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
}

export function useSendBCQInvitation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      bcqAccessToken,
    }: SendBCQInvitationParams) => {
      // Build BCQ portal URL
      const bcqPortalUrl = `${window.location.origin}/bcq/${applicationId}/${bcqAccessToken}`;

      // Send notification email with BCQ portal URL
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          applicationId,
          type: 'bcq_invitation',
          customMessage: bcqPortalUrl, // Pass URL as customMessage to use in template
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Update bcq_invitation_sent_at timestamp and status to bcq_sent
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          bcq_invitation_sent_at: new Date().toISOString(),
          status: 'bcq_sent'
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs', variables.applicationId] });
      toast({
        title: "BCQ Invitation Sent",
        description: "The candidate will receive an email with the assessment link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send BCQ Invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
