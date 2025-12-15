import { AIEvaluationCard } from '@/components/recruiter/AIEvaluationCard';
import { BusinessCaseViewer } from '@/components/candidate-profile/BusinessCaseViewer';
import { DocumentsSection } from '@/components/candidate-profile/DocumentsSection';
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
  cvUrl: string | null;
  discUrl: string | null;
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
          <Brain className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
          <div>
            <p className="text-sm font-medium">No AI Evaluation Yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run AI analysis to get insights about this candidate
            </p>
          </div>
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
        </div>
      )}

      {/* CV & DISC Documents with Analyses */}
      <DocumentsSection
        applicationId={applicationId}
        cvUrl={cvUrl}
        discUrl={discUrl}
      />

      {/* Business Case Responses */}
      <BusinessCaseViewer applicationId={applicationId} jobId={jobId} />
    </div>
  );
}
