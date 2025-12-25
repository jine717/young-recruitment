import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  job_id: string;
  bcq_access_token: string | null;
  bcq_invitation_sent_at: string | null;
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
  transcription: string | null;
  fluency_pronunciation_score: number | null;
  fluency_pace_score: number | null;
  fluency_hesitation_score: number | null;
  fluency_grammar_score: number | null;
  fluency_overall_score: number | null;
  fluency_notes: string | null;
}

export function useBCQPortal(applicationId: string | undefined, token: string | undefined) {
  const [application, setApplication] = useState<Application | null>(null);
  const [businessCases, setBusinessCases] = useState<BusinessCase[]>([]);
  const [responses, setResponses] = useState<Record<string, BCQResponse>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
        bcq_invitation_sent_at: (appWithBCQ as any).bcq_invitation_sent_at || null,
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

    // Clear any previous errors
    setError(null);

    // Validate video blob before attempting upload
    if (!videoBlob || videoBlob.size === 0) {
      console.error('Video validation failed: Empty blob', { size: videoBlob?.size, type: videoBlob?.type });
      setError('Recording is empty. Please try recording again.');
      return;
    }

    // Check for reasonable size limit (100MB)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (videoBlob.size > maxSizeBytes) {
      console.error('Video validation failed: Too large', { size: videoBlob.size, maxSize: maxSizeBytes });
      setError(`Recording is too large (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB). Please record a shorter video.`);
      return;
    }

    console.log('Starting video upload:', { 
      questionId, 
      blobSize: videoBlob.size, 
      blobType: videoBlob.type,
      applicationId: application.id 
    });

    // Record start time on first response
    await recordStarted();

    setIsUploading(true);

    try {
      // Upload video to storage with retry logic
      const fileName = `${application.id}/${questionId}.webm`;
      let uploadAttempts = 0;
      const maxAttempts = 2;
      let lastUploadError: Error | null = null;

      while (uploadAttempts < maxAttempts) {
        uploadAttempts++;
        console.log(`Upload attempt ${uploadAttempts}/${maxAttempts}...`);

        // First, try to remove existing file (ignore errors if it doesn't exist)
        await supabase.storage
          .from('business-case-videos')
          .remove([fileName]);

        // Then upload new file (without upsert to avoid RLS issues)
        const { error: uploadError } = await supabase.storage
          .from('business-case-videos')
          .upload(fileName, videoBlob, {
            contentType: 'video/webm'
          });

        if (!uploadError) {
          console.log('Upload successful on attempt', uploadAttempts);
          lastUploadError = null;
          break;
        }

        console.error('Upload error on attempt', uploadAttempts, ':', {
          message: uploadError.message,
          name: uploadError.name,
          statusCode: (uploadError as any).statusCode,
          error: uploadError
        });

        lastUploadError = new Error(uploadError.message);

        if (uploadAttempts >= maxAttempts) {
          break;
        }

        // Wait before retry
        console.log('Waiting 1s before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (lastUploadError) {
        throw new Error(`Failed to upload video after ${maxAttempts} attempts: ${lastUploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('business-case-videos')
        .getPublicUrl(fileName);

      const videoUrl = urlData.publicUrl;
      console.log('Video URL obtained:', videoUrl);

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
        console.error('Response save error:', {
          message: respError.message,
          code: respError.code,
          details: respError.details,
          hint: respError.hint
        });
        throw new Error(`Failed to save response: ${respError.message}`);
      }

      console.log('Response record saved:', respData.id);

      setIsUploading(false);

      // Update local responses (transcription will be done on-demand by recruiter)
      setResponses(prev => ({
        ...prev,
        [questionId]: respData
      }));

      console.log('Video uploaded successfully. Transcription will be done by recruiter on demand.');

      // Check if all questions are answered
      const completedCount = Object.keys(responses).length + 1;
      if (completedCount >= businessCases.length) {
        await completeAllQuestions();
      } else {
        // Move to next question
        goToNextQuestion();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Submit response error:', { error: err, message: errorMessage });
      setError(`Failed to submit response: ${errorMessage}`);
      setIsUploading(false);
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
    // Use invitation sent time as reference for delay calculation
    const invitationSentAt = application.bcq_invitation_sent_at
      ? new Date(application.bcq_invitation_sent_at)
      : application.bcq_link_opened_at 
        ? new Date(application.bcq_link_opened_at) 
        : now;
    
    const responseTimeMinutes = Math.round(
      (now.getTime() - invitationSentAt.getTime()) / (1000 * 60)
    );

    // Check if delayed (more than 24 hours since invitation sent)
    const isDelayed = (now.getTime() - invitationSentAt.getTime()) > (24 * 60 * 60 * 1000);

    await supabase
      .from('applications')
      .update({
        business_case_completed: true,
        business_case_completed_at: now.toISOString(),
        bcq_response_time_minutes: responseTimeMinutes,
        bcq_delayed: isDelayed,
        status: 'bcq_received'
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
    isCompleted,
    error,
    responseTimeMinutes,
    
    // Actions
    submitResponse,
    goToNextQuestion,
    goToPreviousQuestion
  };
}
