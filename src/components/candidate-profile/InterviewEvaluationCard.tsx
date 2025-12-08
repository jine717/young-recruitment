import { format } from 'date-fns';
import { useInterviewEvaluations, useDeleteInterviewEvaluation, type InterviewEvaluation } from '@/hooks/useInterviewEvaluations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Trash2, ClipboardList, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterviewEvaluationsCardProps {
  applicationId: string;
}

function ScoreDisplay({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= score ? 'fill-primary text-primary' : 'text-muted'}`}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: InterviewEvaluation['recommendation'] }) {
  const config = {
    strong_hire: { 
      label: 'Strong Hire', 
      className: 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/50',
      icon: CheckCircle 
    },
    hire: { 
      label: 'Hire', 
      className: 'bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/30',
      icon: CheckCircle 
    },
    no_hire: { 
      label: 'No Hire', 
      className: 'bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/50',
      icon: XCircle 
    },
    strong_no_hire: { 
      label: 'Strong No Hire', 
      className: 'bg-destructive/10 text-destructive border-destructive/50',
      icon: AlertCircle 
    },
  };

  if (!recommendation) return null;
  const { label, className, icon: Icon } = config[recommendation];

  return (
    <Badge className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

function EvaluationItem({ evaluation, applicationId }: { evaluation: InterviewEvaluation; applicationId: string }) {
  const { toast } = useToast();
  const deleteEvaluation = useDeleteInterviewEvaluation();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this evaluation?')) return;
    try {
      await deleteEvaluation.mutateAsync({ evaluationId: evaluation.id, applicationId });
      toast({ title: 'Evaluation deleted' });
    } catch {
      toast({ title: 'Error deleting evaluation', variant: 'destructive' });
    }
  };

  const averageScore = [
    evaluation.technical_score,
    evaluation.communication_score,
    evaluation.cultural_fit_score,
    evaluation.problem_solving_score,
  ].filter(Boolean).reduce((a, b) => a! + b!, 0)! / 4;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Interview on {format(new Date(evaluation.interview_date), 'MMM d, yyyy h:mm a')}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <RecommendationBadge recommendation={evaluation.recommendation} />
            <span className="text-sm font-medium">
              Avg: {averageScore.toFixed(1)}/5
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ScoreDisplay label="Technical" score={evaluation.technical_score} />
        <ScoreDisplay label="Communication" score={evaluation.communication_score} />
        <ScoreDisplay label="Cultural Fit" score={evaluation.cultural_fit_score} />
        <ScoreDisplay label="Problem Solving" score={evaluation.problem_solving_score} />
      </div>

      {evaluation.overall_impression && (
        <div>
          <p className="text-sm font-medium mb-1">Overall Impression</p>
          <p className="text-sm text-muted-foreground">{evaluation.overall_impression}</p>
        </div>
      )}

      {evaluation.strengths.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Strengths</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {evaluation.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.areas_for_improvement.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Areas for Improvement</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {evaluation.areas_for_improvement.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function InterviewEvaluationsCard({ applicationId }: InterviewEvaluationsCardProps) {
  const { data: evaluations, isLoading } = useInterviewEvaluations(applicationId);

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  return (
    <Card className="shadow-young-sm hover-lift transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Interview Evaluations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evaluations && evaluations.length > 0 ? (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <EvaluationItem
                key={evaluation.id}
                evaluation={evaluation}
                applicationId={applicationId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No interview evaluations recorded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
