import { AIEvaluationCard } from '@/components/recruiter/AIEvaluationCard';
import { DocumentsSection } from '@/components/candidate-profile/DocumentsSection';
import { ReviewProgressTracker } from '@/components/candidate-profile/ReviewProgressTracker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Loader2, CheckCircle2 } from 'lucide-react';
import { type ReviewProgress, type ReviewSection } from '@/hooks/useReviewProgress';

interface OverviewTabProps {
  applicationId: string;
  jobId: string;
  aiEvaluation: any;
  aiLoading: boolean;
  onTriggerAI: () => void;
  isTriggering: boolean;
  cvUrl: string | null;
  discUrl: string | null;
  // Review progress props
  reviewProgress: ReviewProgress | null;
  reviewProgressLoading: boolean;
  onReviewSection: (section: ReviewSection, reviewed: boolean) => void;
  onCompleteReview: () => void;
  isCompletingReview: boolean;
  canEdit: boolean;
  applicationStatus: string;
}

function ReviewCheckbox({ 
  label, 
  checked, 
  onCheckedChange, 
  disabled 
}: { 
  label: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        {checked ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <Checkbox 
            checked={checked} 
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        )}
        <span className={`text-sm ${checked ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
          {checked ? `${label} ✓` : `Mark ${label} as reviewed`}
        </span>
      </div>
    </div>
  );
}

export function OverviewTab({ 
  applicationId, 
  jobId, 
  aiEvaluation, 
  aiLoading, 
  onTriggerAI, 
  isTriggering,
  cvUrl,
  discUrl,
  reviewProgress,
  reviewProgressLoading,
  onReviewSection,
  onCompleteReview,
  isCompletingReview,
  canEdit,
  applicationStatus,
}: OverviewTabProps) {
  // Show review progress for review stages (not pending, hired, rejected)
  const showReviewProgress = ['under_review', 'reviewed', 'interview', 'interviewed'].includes(applicationStatus) && canEdit;

  return (
    <div className="space-y-4">
      {/* Review Progress Tracker - only show when in review status */}
      {showReviewProgress && (
        <ReviewProgressTracker
          progress={reviewProgress}
          isLoading={reviewProgressLoading}
          applicationStatus={applicationStatus}
        />
      )}

      {/* AI Evaluation - Primary Focus */}
      {aiLoading ? (
        <Skeleton className="h-64" />
      ) : aiEvaluation ? (
        <div className="space-y-2">
          <AIEvaluationCard evaluation={aiEvaluation} />
          {showReviewProgress && (
            <ReviewCheckbox
              label="AI Analysis"
              checked={reviewProgress?.ai_analysis_reviewed ?? false}
              onCheckedChange={(checked) => onReviewSection('ai_analysis', checked)}
              disabled={!canEdit || reviewProgress?.ai_analysis_reviewed === true}
            />
          )}
        </div>
      ) : (
        <div className="p-6 bg-muted/30 rounded-lg text-center space-y-3 border border-dashed">
          <Brain className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
          <div>
            <p className="text-sm font-medium">No AI Evaluation Yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run AI analysis to get insights about this candidate
            </p>
          </div>
          {canEdit && (
            <Button 
              onClick={onTriggerAI} 
              disabled={isTriggering}
              className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
            >
              {isTriggering ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Run AI Analysis
            </Button>
          )}
        </div>
      )}

      {/* CV & DISC Documents with Analyses */}
      <div className="space-y-2">
        <DocumentsSection
          applicationId={applicationId}
          cvUrl={cvUrl}
          discUrl={discUrl}
        />
        {showReviewProgress && (
          <div className="grid grid-cols-2 gap-2">
            <ReviewCheckbox
              label="CV Analysis"
              checked={reviewProgress?.cv_analysis_reviewed ?? false}
              onCheckedChange={(checked) => onReviewSection('cv_analysis', checked)}
              disabled={!canEdit || reviewProgress?.cv_analysis_reviewed === true}
            />
            <ReviewCheckbox
              label="DISC Analysis"
              checked={reviewProgress?.disc_analysis_reviewed ?? false}
              onCheckedChange={(checked) => onReviewSection('disc_analysis', checked)}
              disabled={!canEdit || reviewProgress?.disc_analysis_reviewed === true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
