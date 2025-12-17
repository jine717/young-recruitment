import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoRecorder } from './VideoRecorder';
import { CheckCircle2, Loader2, Video as VideoIcon } from 'lucide-react';

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
  isTranscribing: boolean;
  isCompleted: boolean;
  onRecordingComplete: (blob: Blob) => void;
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  isUploading,
  isTranscribing,
  isCompleted,
  onRecordingComplete
}: QuestionCardProps) {
  const isProcessing = isUploading || isTranscribing;
  
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/20"
          >
            Question {questionIndex + 1} of {totalQuestions}
          </Badge>
          
          {isCompleted && (
            <Badge className="bg-chart-1 text-white border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-xl text-foreground">
          {question.question_title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question Description */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-foreground whitespace-pre-wrap">
            {question.question_description}
          </p>
        </div>
        
        {/* Explainer Video (if exists) */}
        {question.video_url && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <VideoIcon className="w-4 h-4" />
              <span>Watch the explanation video before recording your response</span>
            </div>
            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              <video
                src={question.video_url}
                controls
                className="w-full h-full"
              />
            </div>
          </div>
        )}
        
        {/* Recording Section */}
        {isCompleted ? (
          <div className="flex items-center justify-center p-8 bg-chart-1/10 rounded-lg border border-chart-1/20">
            <CheckCircle2 className="w-8 h-8 text-chart-1 mr-3" />
            <span className="text-lg font-medium text-foreground">
              Response recorded successfully!
            </span>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center p-8 bg-primary/10 rounded-lg border border-primary/20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <span className="text-lg font-medium text-foreground mb-1">
              {isUploading ? 'Uploading video...' : 'Transcribing response...'}
            </span>
            <span className="text-sm text-muted-foreground">
              Please wait, this may take a moment
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Record Your Response</h4>
            <VideoRecorder onRecordingComplete={onRecordingComplete} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
