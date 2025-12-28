import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { extractVideoPath } from '@/hooks/useVideoUrl';

interface TranscribeParams {
  responseId: string;
  videoUrl: string;
  applicationId: string;
}

/**
 * Creates a mutation hook that transcribes a business-case video response and invalidates related queries.
 *
 * @returns A React Query mutation object which, when called with an object containing `responseId`, `videoUrl`, and `applicationId`, sends `videoPath` (extracted from `videoUrl` when necessary) and `responseId` to the Supabase edge function `transcribe-video` and resolves to the edge function's response object. The resolved response is expected to include a `text` field containing the transcription.
 */
export function useTranscribeBCQResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ responseId, videoUrl }: TranscribeParams) => {
      // Extract video path from URL using shared utility
      const videoPath = extractVideoPath(videoUrl);
      
      if (!videoPath) {
        throw new Error('Invalid video URL: could not extract path');
      }

      // Call the edge function which will handle downloading from private storage
      const { data, error } = await supabase.functions
        .invoke('transcribe-video', {
          body: {
            videoPath,
            responseId,
          }
        });

      if (error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }

      if (!data?.text) {
        throw new Error('No transcription returned');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Video transcribed successfully');
      queryClient.invalidateQueries({ queryKey: ['business-case-responses', variables.applicationId] });
    },
    onError: (error: Error) => {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Failed to transcribe video');
    }
  });
}