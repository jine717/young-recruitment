import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { VideoRecorder } from '@/components/business-case/VideoRecorder';
import { VideoPlayer } from '@/components/business-case/VideoPlayer';
import { BusinessCaseProgress } from '@/components/business-case/BusinessCaseProgress';
import { 
  useApplication, 
  useBusinessCases, 
  useBusinessCaseResponses,
  useSubmitBusinessCaseResponse,
  useCompleteBusinessCase,
} from '@/hooks/useBusinessCase';
import { useSendNotification } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function BusinessCase() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const { data: application, isLoading: appLoading } = useApplication(applicationId);
  const { data: businessCases = [], isLoading: casesLoading } = useBusinessCases(application?.job_id);
  const { data: responses = [], isLoading: responsesLoading } = useBusinessCaseResponses(applicationId);
  
  const submitResponse = useSubmitBusinessCaseResponse();
  const completeBusinessCase = useCompleteBusinessCase();
  const sendNotification = useSendNotification();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [textResponse, setTextResponse] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranscribed, setIsTranscribed] = useState(false);

  const isLoading = authLoading || appLoading || casesLoading || responsesLoading;
  const currentCase = businessCases[currentQuestionIndex];
  
  const completedQuestions = responses
    .filter(r => r.completed_at)
    .map(r => businessCases.findIndex(bc => bc.id === r.business_case_id) + 1)
    .filter(n => n > 0);

  // Check if current question is already answered
  const currentResponse = currentCase 
    ? responses.find(r => r.business_case_id === currentCase.id && r.completed_at)
    : null;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (application && user && application.candidate_id !== user.id) {
      toast({
        title: "Access Denied",
        description: "You don't have access to this application.",
        variant: "destructive",
      });
      navigate('/jobs');
    }
  }, [application, user, navigate, toast]);

  useEffect(() => {
    if (application?.business_case_completed) {
      // Already completed, show completion state
    }
  }, [application]);

  const uploadVideo = async (blob: Blob): Promise<string | null> => {
    if (!user || !applicationId) return null;
    
    const fileName = `${user.id}/${applicationId}/${currentCase?.id}-${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('business-case-videos')
      .upload(fileName, blob);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Return just the path, not the full URL (for proper signed URL generation later)
    return fileName;
  };

  const handleSubmitResponse = async () => {
    if (!applicationId || !currentCase) return;
    
    setIsSubmitting(true);
    
    try {
      let videoUrl: string | undefined;
      
      if (videoBlob) {
        const url = await uploadVideo(videoBlob);
        if (url) videoUrl = url;
      }

      await submitResponse.mutateAsync({
        applicationId,
        businessCaseId: currentCase.id,
        videoUrl,
        textResponse: textResponse || undefined,
      });

      toast({
        title: "Response Submitted",
        description: `Question ${currentQuestionIndex + 1} completed successfully.`,
      });

      // Move to next question or complete
      if (currentQuestionIndex < businessCases.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTextResponse('');
        setVideoBlob(null);
        setIsTranscribed(false);
      } else {
        // All questions completed
        await completeBusinessCase.mutateAsync(applicationId);
        
        // Trigger AI analysis in the background
        supabase.functions.invoke('analyze-candidate', {
          body: { applicationId },
        }).catch(err => {
          console.error('AI analysis trigger failed:', err);
        });

        // Send completion notification (fire and forget)
        sendNotification.mutate({
          applicationId,
          type: 'status_update',
          customMessage: 'Your business case has been successfully submitted and is now under review by our team.',
        });
        
        toast({
          title: "Business Case Completed!",
          description: "Your application is now under review. Our AI is analyzing your responses.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application || businessCases.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Business Case Not Found</h1>
        <p className="text-muted-foreground mb-6">This application doesn't have business case questions.</p>
        <Button asChild>
          <Link to="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  if (application.business_case_completed) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border py-4 px-6">
          <div className="container mx-auto flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-tighter">YOUNG.</Link>
          </div>
        </nav>

        <main className="container mx-auto py-12 px-4">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-2xl">Business Case Completed!</CardTitle>
              <CardDescription>
                Thank you for completing the business case for {application.jobs?.title}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Your application is now under review. Our AI will analyze your responses 
                and a recruiter will be in touch soon.
              </p>
              <Button asChild>
                <Link to="/jobs">Browse More Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tighter">YOUNG.</Link>
          <span className="text-sm text-muted-foreground">
            Business Case: {application.jobs?.title}
          </span>
        </div>
      </nav>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <BusinessCaseProgress
            totalQuestions={businessCases.length}
            currentQuestion={currentQuestionIndex + 1}
            completedQuestions={completedQuestions}
          />
        </div>

        {/* Current Question */}
        {currentCase && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {businessCases.length}
                </span>
              </div>
              <CardTitle className="text-xl">{currentCase.question_title}</CardTitle>
              <CardDescription className="text-base">
                {currentCase.question_description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team member's video (if available) */}
              {currentCase.video_url && (
                <div>
                  <h3 className="font-medium mb-2">Watch the Question Video</h3>
                  <VideoPlayer src={currentCase.video_url} />
                </div>
              )}

              {/* Already completed */}
              {currentResponse ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="flex items-center gap-2 text-primary font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    You've already completed this question
                  </p>
                  {currentResponse.text_response && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your response: {currentResponse.text_response}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Video Response */}
                  <div>
                    <h3 className="font-medium mb-2">Record Your Response</h3>
                    <VideoRecorder 
                      onVideoReady={(blob) => {
                        setVideoBlob(blob);
                        setIsTranscribed(false);
                      }}
                      onTranscriptReady={(transcript) => {
                        setTextResponse(transcript);
                        setIsTranscribed(true);
                        toast({
                          title: "Transcription Complete",
                          description: "Your video has been transcribed. Feel free to edit the text.",
                        });
                      }}
                      disabled={isSubmitting}
                      enableTranscription={currentCase.has_text_response}
                    />
                    {videoBlob && (
                      <p className="mt-2 text-sm text-primary">
                        ✓ Video ready ({(videoBlob.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  {/* Text Response (if required) */}
                  {currentCase.has_text_response && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">Written Response</h3>
                        {isTranscribed && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            AI Transcribed
                          </span>
                        )}
                      </div>
                      <Textarea
                        placeholder="Type your response here or record a video to auto-transcribe..."
                        value={textResponse}
                        onChange={(e) => {
                          setTextResponse(e.target.value);
                          if (isTranscribed) setIsTranscribed(false);
                        }}
                        rows={4}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  disabled={currentQuestionIndex === 0 || isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentResponse ? (
                  currentQuestionIndex === businessCases.length - 1 ? (
                    // Last question already answered - show complete button
                    <Button
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          await completeBusinessCase.mutateAsync(applicationId!);
                          
                          // Trigger AI analysis in the background
                          supabase.functions.invoke('analyze-candidate', {
                            body: { applicationId },
                          }).catch(err => {
                            console.error('AI analysis trigger failed:', err);
                          });

                          // Send completion notification
                          sendNotification.mutate({
                            applicationId: applicationId!,
                            type: 'status_update',
                            customMessage: 'Your business case has been successfully submitted and is now under review by our team.',
                          });
                          
                          toast({
                            title: "Business Case Completed!",
                            description: "Your application is now under review. Our AI is analyzing your responses.",
                          });
                          
                          // Redirect after a short delay so user sees the toast
                          setTimeout(() => {
                            navigate(`/candidate/application/${applicationId}`);
                          }, 1500);
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to complete business case. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Complete Business Case
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    // Not last question - show next button
                    <Button
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={isSubmitting || (!videoBlob && !textResponse)}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {currentQuestionIndex === businessCases.length - 1 
                      ? 'Complete Business Case' 
                      : 'Submit & Continue'}
                    {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
