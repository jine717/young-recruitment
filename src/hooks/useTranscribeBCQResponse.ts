import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranscribeParams {
  responseId: string;
  videoUrl: string;
  applicationId: string;
}

export function useTranscribeBCQResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ responseId, videoUrl }: TranscribeParams) => {
      // Extract video path from URL if needed
      let videoPath = videoUrl;
      if (videoPath.startsWith('http')) {
        const match = videoPath.match(/\/business-case-videos\/(.+?)(?:\?|$)/);
        if (match) {
          videoPath = match[1];
        }
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
