import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ApplicationWithDetails } from '@/hooks/useApplications';
import { NotificationType } from '@/hooks/useNotifications';
import { format } from 'date-fns';

type ApplicationStatus = ApplicationWithDetails['status'];

interface BulkActionResult {
  success: number;
  failed: number;
}

export function useBulkActions() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkUpdateStatus = async (
    applicationIds: string[],
    newStatus: ApplicationStatus
  ): Promise<BulkActionResult> => {
    setIsUpdating(true);
    let success = 0;
    let failed = 0;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .in('id', applicationIds);

      if (error) {
        throw error;
      }

      success = applicationIds.length;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['applications'] });

      toast({
        title: 'Status Updated',
        description: `Successfully updated ${success} applications to "${newStatus}".`,
      });
    } catch (error) {
      console.error('Bulk status update error:', error);
      failed = applicationIds.length;
      toast({
        title: 'Error',
        description: 'Failed to update some applications.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }

    return { success, failed };
  };

  const bulkSendNotification = async (
    applicationIds: string[],
    notificationType: string
  ): Promise<BulkActionResult> => {
    setIsUpdating(true);
    let success = 0;
    let failed = 0;

    for (const applicationId of applicationIds) {
      try {
        const { error } = await supabase.functions.invoke('send-notification', {
          body: {
            applicationId,
            type: notificationType as NotificationType,
          },
        });

        if (error) {
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error(`Failed to send notification for ${applicationId}:`, error);
        failed++;
      }
    }

    toast({
      title: 'Notifications Sent',
      description: `Sent ${success} notifications${failed > 0 ? `, ${failed} failed` : ''}.`,
      variant: failed > 0 ? 'destructive' : 'default',
    });

    setIsUpdating(false);
    return { success, failed };
  };

  const exportApplications = (applications: ApplicationWithDetails[]) => {
    const headers = [
      'Candidate Name',
      'Email',
      'Position',
      'Department',
      'Status',
      'AI Score',
      'Business Case',
      'Applied Date',
    ];

    const rows = applications.map((app) => [
      app.profiles?.full_name || 'Unknown',
      app.profiles?.email || '',
      app.jobs?.title || 'Unknown',
      app.jobs?.departments?.name || 'General',
      app.status,
      app.ai_score?.toString() || 'N/A',
      app.business_case_completed ? 'Complete' : 'Incomplete',
      format(new Date(app.created_at), 'yyyy-MM-dd'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${applications.length} applications to CSV.`,
    });
  };

  return {
    isUpdating,
    bulkUpdateStatus,
    bulkSendNotification,
    exportApplications,
  };
}
