import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  job_id: string;
  bcq_access_token: string | null;
  bcq_link_opened_at: string | null;
  bcq_started_at: string | null;
  bcq_completed_at: string | null;
  business_case_completed: boolean;
  job?: {
    title: string;
  } | null;
}

interface BusinessCase {
  id: string;
  question_number: number;
  question_title: string;
  question_description: string;
  video_url: string | null;
}

interface BCQResponse {
  id: string;
  business_case_id: string;
  video_url: string | null;
  text_response: string | null;
}

export function useBCQPortal(applicationId: string | undefined, token: string | undefined) {
  const [application, setApplication] = useState<Application | null>(null);
  const [businessCases, setBusinessCases] = useState<BusinessCase[]>([]);
  const [responses, setResponses] = useState<Record<string, BCQResponse>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate access and load data
  const validateAndLoadData = useCallback(async () => {
    if (!applicationId || !token) {
      setIsValidToken(false);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch application - use raw query to get all columns including new BCQ ones
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(title)
        `)
        .eq('id', applicationId)
        .single();

      if (appError || !appData) {
        console.error('Application fetch failed:', appError);
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }

      // Cast to access BCQ columns (they exist in DB but not in generated types yet)
      const appWithBCQ = appData as unknown as Application & { 
        bcq_access_token: string | null;
        job: { title: string } | { title: string }[] | null;
      };

      // Validate token
      if (appWithBCQ.bcq_access_token !== token) {
        console.error('Token mismatch');
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }

      // Check if already completed
      if (appWithBCQ.business_case_completed) {
        setIsCompleted(true);
      }

      // Transform the data to match our interface
      const transformedApp: Application = {
        id: appWithBCQ.id,
        candidate_name: appWithBCQ.candidate_name,
        candidate_email: appWithBCQ.candidate_email,
        job_id: appWithBCQ.job_id,
        bcq_access_token: appWithBCQ.bcq_access_token,
        bcq_link_opened_at: (appWithBCQ as any).bcq_link_opened_at || null,
        bcq_started_at: (appWithBCQ as any).bcq_started_at || null,
        bcq_completed_at: (appWithBCQ as any).bcq_completed_at || null,
        business_case_completed: appWithBCQ.business_case_completed,
        job: Array.isArray(appWithBCQ.job) ? appWithBCQ.job[0] : appWithBCQ.job
      };

      setApplication(transformedApp);
      setIsValidToken(true);

      // Record link opened time if not already recorded
      if (!transformedApp.bcq_link_opened_at) {
        await supabase
          .from('applications')
          .update({ bcq_link_opened_at: new Date().toISOString() } as any)
          .eq('id', applicationId);
        
        transformedApp.bcq_link_opened_at = new Date().toISOString();
        setApplication({ ...transformedApp });
      }

      // Fetch business cases for this job
      const { data: bcData, error: bcError } = await supabase
        .from('business_cases')
        .select('*')
        .eq('job_id', transformedApp.job_id)
        .order('question_number', { ascending: true });

      if (bcError) {
        console.error('Error fetching business cases:', bcError);
        setError('Failed to load questions');
        setIsLoading(false);
        return;
      }

      setBusinessCases(bcData || []);

      // Fetch existing responses
      const { data: respData } = await supabase
        .from('business_case_responses')
        .select('*')
        .eq('application_id', applicationId);

      if (respData) {
        const responsesMap: Record<string, BCQResponse> = {};
        respData.forEach(resp => {
          responsesMap[resp.business_case_id] = resp;
        });
        setResponses(responsesMap);

        // Find first unanswered question
        const firstUnansweredIndex = (bcData || []).findIndex(
          bc => !responsesMap[bc.id]?.video_url
        );
        if (firstUnansweredIndex >= 0) {
          setCurrentQuestionIndex(firstUnansweredIndex);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error in validateAndLoadData:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => {
    validateAndLoadData();
  }, [validateAndLoadData]);

  // Record when candidate starts recording (first response)
  const recordStarted = useCallback(async () => {
    if (!application || application.bcq_started_at) return;
    
    await supabase
      .from('applications')
      .update({ bcq_started_at: new Date().toISOString() } as any)
      .eq('id', application.id);
  }, [application]);

  // Submit a video response
  const submitResponse = useCallback(async (questionId: string, videoBlob: Blob) => {
    if (!application) return;

    // Record start time on first response
    await recordStarted();

    setIsUploading(true);

    try {
      // Upload video to storage
      const fileName = `${application.id}/${questionId}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('business-case-videos')
        .upload(fileName, videoBlob, {
          contentType: 'video/webm',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload video');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('business-case-videos')
        .getPublicUrl(fileName);

      const videoUrl = urlData.publicUrl;

      // Create or update response record
      const { data: respData, error: respError } = await supabase
        .from('business_case_responses')
        .upsert({
          application_id: application.id,
          business_case_id: questionId,
          video_url: videoUrl,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'application_id,business_case_id'
        })
        .select()
        .single();

      if (respError) {
        console.error('Response save error:', respError);
        throw new Error('Failed to save response');
      }

      setIsUploading(false);
      setIsTranscribing(true);

      // Transcribe the video
      try {
        // Convert blob to base64 for transcription
        const arrayBuffer = await videoBlob.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        const { data: transcriptionData, error: transcriptionError } = await supabase.functions
          .invoke('transcribe-video', {
            body: {
              audio: base64Audio,
              contentType: 'video/webm',
              language: 'en'
            }
          });

        if (transcriptionError) {
          console.error('Transcription error:', transcriptionError);
        } else if (transcriptionData?.text) {
          // Update response with transcription
          await supabase
            .from('business_case_responses')
            .update({ 
              text_response: transcriptionData.text 
            })
            .eq('id', respData.id);

          // Update local state
          setResponses(prev => ({
            ...prev,
            [questionId]: {
              ...respData,
              text_response: transcriptionData.text
            }
          }));
        }
      } catch (transcriptError) {
        console.error('Transcription failed:', transcriptError);
        // Continue without transcription - it can be retried later
      }

      // Update local responses
      setResponses(prev => ({
        ...prev,
        [questionId]: respData
      }));

      setIsTranscribing(false);

      // Check if all questions are answered
      const completedCount = Object.keys(responses).length + 1;
      if (completedCount >= businessCases.length) {
        await completeAllQuestions();
      } else {
        // Move to next question
        goToNextQuestion();
      }
    } catch (err) {
      console.error('Submit response error:', err);
      setError('Failed to submit response. Please try again.');
      setIsUploading(false);
      setIsTranscribing(false);
    }
  }, [application, businessCases.length, responses, recordStarted]);

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < businessCases.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, businessCases.length]);

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Complete all questions
  const completeAllQuestions = useCallback(async () => {
    if (!application) return;

    const now = new Date();
    const linkOpenedAt = application.bcq_link_opened_at 
      ? new Date(application.bcq_link_opened_at) 
      : now;
    
    const responseTimeMinutes = Math.round(
      (now.getTime() - linkOpenedAt.getTime()) / (1000 * 60)
    );

    // Check if delayed (more than 24 hours since link opened)
    const isDelayed = (now.getTime() - linkOpenedAt.getTime()) > (24 * 60 * 60 * 1000);

    await supabase
      .from('applications')
      .update({
        business_case_completed: true,
        business_case_completed_at: now.toISOString(),
        bcq_response_time_minutes: responseTimeMinutes,
        bcq_delayed: isDelayed
      } as any)
      .eq('id', application.id);

    setIsCompleted(true);
  }, [application]);

  // Get completed question indices
  const completedQuestions = businessCases
    .map((bc, index) => responses[bc.id]?.video_url ? index : -1)
    .filter(index => index >= 0);

  // Calculate response time for completion screen
  const responseTimeMinutes = application?.bcq_link_opened_at
    ? Math.round(
        (new Date().getTime() - new Date(application.bcq_link_opened_at).getTime()) / (1000 * 60)
      )
    : undefined;

  return {
    // Data
    application,
    businessCases,
    responses,
    currentQuestionIndex,
    completedQuestions,
    
    // States
    isLoading,
    isValidToken,
    isUploading,
    isTranscribing,
    isCompleted,
    error,
    responseTimeMinutes,
    
    // Actions
    submitResponse,
    goToNextQuestion,
    goToPreviousQuestion
  };
}
