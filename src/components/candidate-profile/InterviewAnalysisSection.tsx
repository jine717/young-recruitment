import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, ClipboardCheck } from 'lucide-react';
import { useInterviewAnalysis, useTriggerInterviewAnalysis, InterviewAnalysis } from '@/hooks/useInterviewAnalysis';
import { InterviewAnalysisCard } from './InterviewAnalysisCard';
import { useToast } from '@/hooks/use-toast';

interface InterviewAnalysisSectionProps {
  applicationId: string;
}

export function InterviewAnalysisSection({ applicationId }: InterviewAnalysisSectionProps) {
  const { data: analysisDoc, isLoading } = useInterviewAnalysis(applicationId);
  const triggerAnalysis = useTriggerInterviewAnalysis();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    try {
      await triggerAnalysis.mutateAsync(applicationId);
      toast({
        title: "Interview Analyzed",
        description: "The interview analysis and AI Score have been updated.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze interview",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasAnalysis = analysisDoc?.status === 'completed' && analysisDoc.analysis;

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[hsl(var(--young-blue))]" />
              Interview Analysis
            </CardTitle>
            <Button
              onClick={handleAnalyze}
              disabled={triggerAnalysis.isPending}
              size="sm"
              className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
            >
              {triggerAnalysis.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {hasAnalysis ? 'Re-analyze Interview' : 'Analyze Interview'}
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyze recruiter notes and update AI Score based on interview performance
          </p>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      {hasAnalysis && (
        <InterviewAnalysisCard analysis={analysisDoc.analysis as InterviewAnalysis} />
      )}

      {/* Empty State */}
      {!hasAnalysis && !triggerAnalysis.isPending && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No interview analysis yet</p>
            <p className="text-xs mt-1">
              Add notes to interview questions, then click "Analyze Interview" to update the AI Score
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
