import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type AIEvaluation } from '@/hooks/useAIEvaluations';
import { ThumbsUp, ThumbsDown, AlertTriangle, Brain, MessageSquare, Users } from 'lucide-react';

interface AIEvaluationCardProps {
  evaluation: AIEvaluation;
}

export function AIEvaluationCard({ evaluation }: AIEvaluationCardProps) {
  const getRecommendationBadge = (rec: string | null) => {
    switch (rec) {
      case 'proceed':
        return (
          <Badge className="bg-green-500/20 text-green-700 border-green-500/50">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Proceed
          </Badge>
        );
      case 'review':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Review
          </Badge>
        );
      case 'reject':
        return (
          <Badge className="bg-red-500/20 text-red-700 border-red-500/50">
            <ThumbsDown className="w-3 h-3 mr-1" />
            Reject
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Analysis
        </h4>
        {getRecommendationBadge(evaluation.recommendation)}
      </div>

      {/* Summary */}
      {evaluation.summary && (
        <p className="text-sm text-muted-foreground">{evaluation.summary}</p>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Brain className="w-3 h-3" />
            Skills Match
          </div>
          <Progress value={evaluation.skills_match_score || 0} className="h-2" />
          <span className="text-xs font-medium">{evaluation.skills_match_score || 0}%</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            Communication
          </div>
          <Progress value={evaluation.communication_score || 0} className="h-2" />
          <span className="text-xs font-medium">{evaluation.communication_score || 0}%</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            Cultural Fit
          </div>
          <Progress value={evaluation.cultural_fit_score || 0} className="h-2" />
          <span className="text-xs font-medium">{evaluation.cultural_fit_score || 0}%</span>
        </div>
      </div>

      {/* Strengths & Concerns */}
      <div className="grid md:grid-cols-2 gap-4">
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-green-700 mb-2">Strengths</h5>
            <ul className="space-y-1">
              {evaluation.strengths.map((strength, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">+</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.concerns && evaluation.concerns.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-yellow-700 mb-2">Areas to Probe</h5>
            <ul className="space-y-1">
              {evaluation.concerns.map((concern, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-yellow-500 mt-0.5">!</span>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
