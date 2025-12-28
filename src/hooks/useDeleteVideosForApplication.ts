import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeleteVideosResult {
  success: boolean;
  deletedCount: number;
  totalVideos: number;
  message: string;
  errors?: string[];
}

/**
 * Provides a React Query mutation that deletes all videos for a given application.
 *
 * The mutation calls the Supabase edge function `delete-videos-for-application` with an `applicationId`.
 * On successful deletion it invalidates the application's `business-case-responses` and `application-detail` queries to refresh cached data.
 *
 * @returns A React Query mutation object whose mutation function accepts an `applicationId` and yields a `DeleteVideosResult` describing the deletion outcome.
 */
export function useDeleteVideosForApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string): Promise<DeleteVideosResult> => {
      const { data, error } = await supabase.functions.invoke('delete-videos-for-application', {
        body: { applicationId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete videos');
      }

      return data as DeleteVideosResult;
    },
    onSuccess: (_, applicationId) => {
      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['business-case-responses', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
    }
  });
}