import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Calendar, Loader2 } from 'lucide-react';

interface InterviewProgressTrackerProps {
  hasScheduledInterview: boolean;
  hasCompletedInterview: boolean;
  interviewConducted: boolean;
  onInterviewConductedChange: (checked: boolean) => void;
  onMarkComplete: () => void;
  isMarkingComplete: boolean;
  canEdit: boolean;
  applicationStatus: string;
}

export function InterviewProgressTracker({
  hasScheduledInterview,
  hasCompletedInterview,
  interviewConducted,
  onInterviewConductedChange,
  onMarkComplete,
  isMarkingComplete,
  canEdit,
  applicationStatus,
}: InterviewProgressTrackerProps) {
  const isCompleted = hasCompletedInterview || applicationStatus === 'interviewed';
  
  // Calculate progress: 0% (no interview), 50% (scheduled), 100% (completed)
  const getProgress = () => {
    if (isCompleted) return 100;
    if (hasScheduledInterview) return 50;
    return 0;
  };

  const progress = getProgress();
  const canMarkComplete = hasScheduledInterview && interviewConducted && !isCompleted && canEdit;

  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Interview Progress</span>
          {isCompleted ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          ) : hasScheduledInterview ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))]">
              Scheduled
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Not scheduled
            </span>
          )}
        </div>
        {canMarkComplete && (
          <Button
            size="sm"
            onClick={onMarkComplete}
            disabled={isMarkingComplete}
            className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
          >
            {isMarkingComplete ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Mark Interview Complete
          </Button>
        )}
      </div>
      
      <Progress value={progress} variant={isCompleted ? 'success' : 'blue'} className="h-2" />
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
            hasScheduledInterview ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
          }`}>
            {hasScheduledInterview ? <CheckCircle2 className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          </div>
          <span className={hasScheduledInterview ? 'text-foreground' : 'text-muted-foreground'}>
            Interview Scheduled
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <>
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500/10 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span className="text-foreground">Interview Conducted</span>
            </>
          ) : (
            <>
              <Checkbox
                id="interview-conducted"
                checked={interviewConducted}
                onCheckedChange={(checked) => onInterviewConductedChange(checked as boolean)}
                disabled={!hasScheduledInterview || !canEdit}
              />
              <label
                htmlFor="interview-conducted"
                className={`cursor-pointer ${hasScheduledInterview && canEdit ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Interview Conducted
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
