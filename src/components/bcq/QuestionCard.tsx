import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoRecorder } from './VideoRecorder';
import { CheckCircle2, Loader2, Video as VideoIcon, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVideoUrl } from '@/hooks/useVideoUrl';

interface BusinessCase {
  id: string;
  question_number: number;
  question_title: string;
  question_description: string;
  video_url?: string | null;
}

interface QuestionCardProps {
  question: BusinessCase;
  questionIndex: number;
  totalQuestions: number;
  isUploading: boolean;
  isCompleted: boolean;
  onRecordingComplete: (blob: Blob) => void;
}

/**
 * Render a card displaying a business case question, optional explainer video, and recording controls.
 *
 * @param question - The business case data including title, description, optional explainer `video_url`, and identifier.
 * @param questionIndex - Zero-based index of the current question (used for display like "Question X of Y").
 * @param totalQuestions - Total number of questions in the set.
 * @param isUploading - Whether a recording is currently being uploaded; shows an uploading state when `true`.
 * @param isCompleted - Whether a response has already been recorded for this question; shows a completion state when `true`.
 * @param onRecordingComplete - Callback invoked with the recorded `Blob` when the user finishes recording.
 * @returns The rendered QuestionCard element.
 */
export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  isUploading,
  isCompleted,
  onRecordingComplete
}: QuestionCardProps) {
  const isMobile = useIsMobile();
  
  // Get signed URL for explainer video (handles private storage)
  const { url: signedVideoUrl, isLoading: isLoadingVideo } = useVideoUrl(question.video_url);
  
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center justify-between mb-1.5">
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/20 text-xs"
          >
            Question {questionIndex + 1} of {totalQuestions}
          </Badge>
          
          {isCompleted && (
            <Badge className="bg-chart-1 text-white border-0 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Done
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-base sm:text-lg text-foreground leading-tight">
          {question.question_title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Question Description */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {question.question_description}
          </p>
        </div>
        
        {/* Explainer Video (if exists) */}
        {question.video_url && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Watch the explanation video first</span>
            </div>
            <div className={`rounded-lg overflow-hidden bg-black w-full ${
              isMobile 
                ? 'h-[280px]'
                : 'aspect-video max-h-[220px]'
            }`}>
              {isLoadingVideo ? (
                <div className="w-full h-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
                </div>
              ) : signedVideoUrl ? (
                <video
                  src={signedVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Video unavailable</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Recording Section */}
        {isCompleted ? (
          <div className="flex items-center justify-center p-4 bg-chart-1/10 rounded-lg border border-chart-1/20">
            <CheckCircle2 className="w-6 h-6 text-chart-1 mr-2" />
            <span className="text-sm font-medium text-foreground">
              Response recorded!
            </span>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg border border-primary/20">
            <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
            <span className="text-sm font-medium text-foreground">
              Uploading...
            </span>
            <span className="text-xs text-muted-foreground">
              Please wait
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Record Your Response</h4>
            <VideoRecorder onRecordingComplete={onRecordingComplete} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}