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
 * Validates and normalizes the edge function response to ensure all required fields are present.
 * Handles cases where the edge function returns incomplete data (e.g., missing totalVideos).
 */
function normalizeDeleteVideosResult(data: unknown): DeleteVideosResult {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: expected an object');
  }

  const response = data as Record<string, unknown>;

  // Check for error response from edge function
  if ('error' in response && typeof response.error === 'string') {
    throw new Error(response.error);
  }

  // Validate required fields
  if (typeof response.success !== 'boolean') {
    throw new Error('Invalid response: missing or invalid "success" field');
  }
  
  if (typeof response.deletedCount !== 'number') {
    throw new Error('Invalid response: missing or invalid "deletedCount" field');
  }

  // Normalize totalVideos - if missing, default to deletedCount
  const totalVideos = typeof response.totalVideos === 'number' 
    ? response.totalVideos 
    : response.deletedCount;

  // Normalize message
  const message = typeof response.message === 'string'
    ? response.message
    : response.deletedCount === 0 
      ? 'No videos to delete'
      : `Deleted ${response.deletedCount} video(s)`;

  // Normalize errors array
  const errors = Array.isArray(response.errors) 
    ? response.errors.filter((e): e is string => typeof e === 'string')
    : undefined;

  return {
    success: response.success,
    deletedCount: response.deletedCount,
    totalVideos,
    message,
    errors,
  };
}

/**
 * Provides a React Query mutation that deletes all videos for a given application.
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

      return normalizeDeleteVideosResult(data);
    },
    onSuccess: (_, applicationId) => {
      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['business-case-responses', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
    }
  });
}