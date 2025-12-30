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

      console.log('Starting transcription for response:', responseId);
      console.log('Video path:', videoPath);

      // Call the edge function which will handle downloading from private storage
      const { data, error } = await supabase.functions
        .invoke('transcribe-video', {
          body: {
            videoPath,
            responseId,
          }
        });

      // Handle Supabase function invocation errors
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to call transcription service');
      }

      // Handle errors returned in the response body
      if (data?.error) {
        console.error('Transcription service error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.text) {
        console.error('No transcription in response:', data);
        throw new Error('No transcription returned from service');
      }

      console.log('Transcription completed successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Video transcribed successfully');
      queryClient.invalidateQueries({ queryKey: ['business-case-responses', variables.applicationId] });
    },
    onError: (error: Error) => {
      console.error('Transcription error:', error);
      // Show the specific error message from the backend
      toast.error(error.message || 'Failed to transcribe video');
    }
  });
}