import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { type ReviewProgress, getReviewCompletionCount, isReviewComplete } from '@/hooks/useReviewProgress';

interface ReviewProgressTrackerProps {
  progress: ReviewProgress | null;
  isLoading: boolean;
  onCompleteReview: () => void;
  isCompleting: boolean;
}

export function ReviewProgressTracker({
  progress,
  isLoading,
  onCompleteReview,
  isCompleting,
}: ReviewProgressTrackerProps) {
  const { completed, total } = getReviewCompletionCount(progress);
  const allComplete = isReviewComplete(progress);
  const percentage = (completed / total) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading review progress...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Review Progress</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))]">
            {completed}/{total} sections
          </span>
        </div>
        {allComplete && (
          <Button
            size="sm"
            onClick={onCompleteReview}
            disabled={isCompleting}
            className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Complete Review
          </Button>
        )}
      </div>
      <Progress value={percentage} variant="blue" className="h-2" />
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className={`text-center ${progress?.ai_analysis_reviewed ? 'text-green-600' : 'text-muted-foreground'}`}>
          AI Analysis {progress?.ai_analysis_reviewed && '✓'}
        </div>
        <div className={`text-center ${progress?.cv_analysis_reviewed ? 'text-green-600' : 'text-muted-foreground'}`}>
          CV {progress?.cv_analysis_reviewed && '✓'}
        </div>
        <div className={`text-center ${progress?.disc_analysis_reviewed ? 'text-green-600' : 'text-muted-foreground'}`}>
          DISC {progress?.disc_analysis_reviewed && '✓'}
        </div>
        <div className={`text-center ${progress?.business_case_reviewed ? 'text-green-600' : 'text-muted-foreground'}`}>
          Business Case {progress?.business_case_reviewed && '✓'}
        </div>
      </div>
    </div>
  );
}
