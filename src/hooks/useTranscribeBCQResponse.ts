import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper function to convert blob to base64 safely (handles large files)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/webm;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface TranscribeParams {
  responseId: string;
  videoUrl: string;
  applicationId: string;
}

export function useTranscribeBCQResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ responseId, videoUrl }: TranscribeParams) => {
      // 1. Fetch video from URL
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video');
      }
      const videoBlob = await videoResponse.blob();

      // 2. Convert to base64 safely
      const base64Audio = await blobToBase64(videoBlob);

      // 3. Call transcribe-video function
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions
        .invoke('transcribe-video', {
          body: {
            audio: base64Audio,
            contentType: 'video/webm',
            language: 'en'
          }
        });

      if (transcriptionError) {
        throw new Error(`Transcription failed: ${transcriptionError.message}`);
      }

      if (!transcriptionData?.text) {
        throw new Error('No transcription returned');
      }

      // 4. Build update data with transcription and fluency analysis
      const updateData: Record<string, unknown> = {
        transcription: transcriptionData.text
      };

      // Add fluency analysis if available
      if (transcriptionData.fluency_analysis) {
        const fluency = transcriptionData.fluency_analysis;
        if (fluency.pronunciation_score !== undefined) {
          updateData.fluency_pronunciation_score = fluency.pronunciation_score;
        }
        if (fluency.pace_rhythm_score !== undefined) {
          updateData.fluency_pace_score = fluency.pace_rhythm_score;
        }
        if (fluency.hesitation_score !== undefined) {
          updateData.fluency_hesitation_score = fluency.hesitation_score;
        }
        if (fluency.grammar_score !== undefined) {
          updateData.fluency_grammar_score = fluency.grammar_score;
        }
        if (fluency.overall_fluency_score !== undefined) {
          updateData.fluency_overall_score = fluency.overall_fluency_score;
        }
        if (fluency.fluency_notes !== undefined) {
          updateData.fluency_notes = fluency.fluency_notes;
        }
      }

      // 5. Update response record in database
      const { error: updateError } = await supabase
        .from('business_case_responses')
        .update(updateData)
        .eq('id', responseId);

      if (updateError) {
        throw new Error(`Failed to save transcription: ${updateError.message}`);
      }

      return transcriptionData;
    },
    onSuccess: (_, variables) => {
      toast.success('Video transcribed successfully');
      // Invalidate queries to refresh the UI with correct applicationId
      queryClient.invalidateQueries({ queryKey: ['business-case-responses', variables.applicationId] });
    },
    onError: (error: Error) => {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Failed to transcribe video');
    }
  });
}
