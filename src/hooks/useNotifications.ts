import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 
  | 'application_received'
  | 'status_in_review'
  | 'status_reviewed'
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'decision_offer'
  | 'decision_rejection'
  | 'bcq_invitation';

export interface NotificationLog {
  id: string;
  application_id: string;
  notification_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  created_at: string;
}

export function useNotificationLogs(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['notification-logs', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data as NotificationLog[];
    },
    enabled: !!applicationId,
  });
}

export function useSendNotification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      type,
      customMessage,
      interviewDate,
      interviewTime,
      meetingLink,
      location,
      interviewType,
      interviewDateISO,
      durationMinutes,
    }: {
      applicationId: string;
      type: NotificationType;
      customMessage?: string;
      interviewDate?: string;
      interviewTime?: string;
      meetingLink?: string;
      location?: string;
      interviewType?: 'video' | 'phone' | 'in_person';
      interviewDateISO?: string;
      durationMinutes?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: { applicationId, type, customMessage, interviewDate, interviewTime, meetingLink, location, interviewType, interviewDateISO, durationMinutes },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs', variables.applicationId] });
      toast({
        title: "Email Sent",
        description: "Notification sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  application_received: "Application Received",
  status_in_review: "In Review",
  status_reviewed: "Review Complete",
  interview_scheduled: "Interview Scheduled",
  interview_rescheduled: "Interview Rescheduled",
  decision_offer: "Offer Letter",
  decision_rejection: "Rejection Letter",
  bcq_invitation: "BCQ Invitation",
};
