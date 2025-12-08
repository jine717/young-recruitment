import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <Badge className="bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/30">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Proceed
          </Badge>
        );
      case 'review':
        return (
          <Badge className="bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Review
          </Badge>
        );
      case 'reject':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            <ThumbsDown className="w-3 h-3 mr-1" />
            Reject
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-young-sm hover-lift transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[hsl(var(--young-blue))]/15 group-hover:bg-[hsl(var(--young-blue))]/25 transition-colors">
                  <Brain className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                </div>
                AI Analysis
                {evaluation.overall_score !== null && (
                  <span className="text-xs text-muted-foreground font-normal">
                    ({evaluation.overall_score}%)
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {getRecommendationBadge(evaluation.recommendation)}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Summary */}
            {evaluation.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{evaluation.summary}</p>
            )}

            {/* Score Breakdown with brand-colored progress bars */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Brain className="w-3 h-3 text-[hsl(var(--young-blue))]" />
                  Skills Match
                </div>
                <Progress value={evaluation.skills_match_score || 0} variant="blue" className="h-2" />
                <span className="text-xs font-semibold text-[hsl(var(--young-blue))]">{evaluation.skills_match_score || 0}%</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3 text-[hsl(var(--young-gold))]" />
                  Communication
                </div>
                <Progress value={evaluation.communication_score || 0} variant="gold" className="h-2" />
                <span className="text-xs font-semibold text-[hsl(var(--young-gold))]">{evaluation.communication_score || 0}%</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3 text-[hsl(var(--young-khaki))]" />
                  Cultural Fit
                </div>
                <Progress value={evaluation.cultural_fit_score || 0} variant="khaki" className="h-2" />
                <span className="text-xs font-semibold text-[hsl(var(--young-khaki))]">{evaluation.cultural_fit_score || 0}%</span>
              </div>
            </div>

            {/* Strengths & Concerns with brand styling */}
            <div className="grid md:grid-cols-2 gap-4">
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-[hsl(var(--young-blue))]/5 border border-[hsl(var(--young-blue))]/10">
                  <h5 className="text-xs font-semibold text-[hsl(var(--young-blue))] mb-2 flex items-center gap-1.5">
                    <ThumbsUp className="w-3 h-3" />
                    Strengths
                  </h5>
                  <ul className="space-y-1.5">
                    {evaluation.strengths.map((strength, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-[hsl(var(--young-blue))] mt-0.5 font-bold">+</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {evaluation.concerns && evaluation.concerns.length > 0 && (
                <div className="p-3 rounded-lg bg-[hsl(var(--young-gold))]/5 border border-[hsl(var(--young-gold))]/10">
                  <h5 className="text-xs font-semibold text-[hsl(var(--young-gold))] mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Areas to Probe
                  </h5>
                  <ul className="space-y-1.5">
                    {evaluation.concerns.map((concern, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-[hsl(var(--young-gold))] mt-0.5 font-bold">!</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
