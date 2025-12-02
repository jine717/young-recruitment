import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type AIEvaluation } from '@/hooks/useAIEvaluations';
import { ThumbsUp, ThumbsDown, AlertTriangle, Brain, MessageSquare, Users, ChevronDown } from 'lucide-react';

interface AIEvaluationCardProps {
  evaluation: AIEvaluation;
}

export function AIEvaluationCard({ evaluation }: AIEvaluationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="p-4 bg-muted/50 rounded-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header - Always visible */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              AI Analysis
              {evaluation.overall_score !== null && (
                <span className="text-xs text-muted-foreground">
                  ({evaluation.overall_score}%)
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2">
              {getRecommendationBadge(evaluation.recommendation)}
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-4">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
