import { useParams } from 'react-router-dom';
import { useBCQPortal } from '@/hooks/useBCQPortal';
import { QuestionCard } from '@/components/bcq/QuestionCard';
import { BCQProgressBar } from '@/components/bcq/BCQProgressBar';
import { CompletionScreen } from '@/components/bcq/CompletionScreen';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function BusinessCasePortal() {
  const { applicationId, token } = useParams<{ applicationId: string; token: string }>();
  
  const {
    application,
    businessCases,
    responses,
    currentQuestionIndex,
    completedQuestions,
    isLoading,
    isValidToken,
    isUploading,
    isTranscribing,
    isCompleted,
    error,
    responseTimeMinutes,
    submitResponse,
    goToNextQuestion,
    goToPreviousQuestion
  } = useBCQPortal(applicationId, token);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 bg-card rounded-lg border border-border shadow-sm">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Invalid Access Link</h1>
          <p className="text-muted-foreground">
            This link is invalid or has expired. Please contact the recruiter if you believe this is an error.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Contact: <a href="mailto:talents@young.com" className="text-primary hover:underline">talents@young.com</a>
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 bg-card rounded-lg border border-border shadow-sm">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Something Went Wrong</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted && application) {
    return (
      <CompletionScreen
        candidateName={application.candidate_name || 'Candidate'}
        jobTitle={application.job?.title || 'Position'}
        totalQuestions={businessCases.length}
        responseTimeMinutes={responseTimeMinutes}
      />
    );
  }

  // No questions
  if (businessCases.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 bg-card rounded-lg border border-border shadow-sm">
          <AlertCircle className="w-16 h-16 text-secondary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">No Questions Available</h1>
          <p className="text-muted-foreground">
            There are no business case questions configured for this position yet.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = businessCases[currentQuestionIndex];
  const isCurrentQuestionCompleted = !!responses[currentQuestion?.id]?.video_url;

  return (
    <>
      <Helmet>
        <title>Business Case Assessment | YOUNG RECRUITMENT</title>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl text-foreground">YOUNG RECRUITMENT.</h1>
                <p className="text-sm text-muted-foreground">Business Case Assessment</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {application?.candidate_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {application?.job?.title}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Progress Bar */}
            <BCQProgressBar
              currentQuestion={currentQuestionIndex}
              totalQuestions={businessCases.length}
              completedQuestions={completedQuestions}
            />

            {/* Current Question */}
            <QuestionCard
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={businessCases.length}
              isUploading={isUploading}
              isTranscribing={isTranscribing}
              isCompleted={isCurrentQuestionCompleted}
              onRecordingComplete={(blob) => submitResponse(currentQuestion.id, blob)}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0 || isUploading || isTranscribing}
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {businessCases.length}
              </span>

              <Button
                onClick={goToNextQuestion}
                disabled={
                  currentQuestionIndex === businessCases.length - 1 || 
                  !isCurrentQuestionCompleted ||
                  isUploading || 
                  isTranscribing
                }
                variant="outline"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} YOUNG RECRUITMENT. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
