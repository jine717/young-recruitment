import { AIEvaluationCard } from '@/components/recruiter/AIEvaluationCard';
import { AIInsightsCard } from '@/components/candidate-profile/AIInsightsCard';
import { BusinessCaseViewer } from '@/components/candidate-profile/BusinessCaseViewer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Loader2 } from 'lucide-react';

interface OverviewTabProps {
  applicationId: string;
  jobId: string;
  aiEvaluation: any;
  aiLoading: boolean;
  onTriggerAI: () => void;
  isTriggering: boolean;
}

export function OverviewTab({ 
  applicationId, 
  jobId, 
  aiEvaluation, 
  aiLoading, 
  onTriggerAI, 
  isTriggering 
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* AI Evaluation - Primary Focus */}
      {aiLoading ? (
        <Skeleton className="h-64" />
      ) : aiEvaluation ? (
        <AIEvaluationCard evaluation={aiEvaluation} />
      ) : (
        <div className="p-6 bg-muted/30 rounded-lg text-center space-y-3 border border-dashed">
          <Brain className="w-10 h-10 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">No AI Evaluation Yet</p>
            <p className="text-sm text-muted-foreground">
              Run AI analysis to get insights about this candidate
            </p>
          </div>
          <Button onClick={onTriggerAI} disabled={isTriggering}>
            {isTriggering ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Run AI Analysis
          </Button>
        </div>
      )}

      {/* AI Insights - Key factors from CV, DISC, Business Case */}
      <AIInsightsCard applicationId={applicationId} jobId={jobId} />

      {/* Business Case Responses */}
      <BusinessCaseViewer applicationId={applicationId} jobId={jobId} />
    </div>
  );
}
