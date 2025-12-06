import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Lightbulb,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { InterviewAnalysis } from '@/hooks/useInterviewAnalysis';

interface InterviewAnalysisCardProps {
  analysis: InterviewAnalysis;
}

export function InterviewAnalysisCard({ analysis }: InterviewAnalysisCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const scoreChange = analysis.score_change_explanation;
  const isPositive = scoreChange.change > 0;
  const isNegative = scoreChange.change < 0;
  const isNeutral = scoreChange.change === 0;

  const getChangeIcon = () => {
    if (isPositive) return <TrendingUp className="w-5 h-5" />;
    if (isNegative) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getChangeColor = () => {
    if (isPositive) return 'text-green-600 bg-green-50 border-green-200';
    if (isNegative) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-muted-foreground bg-muted/50 border-muted';
  };

  const getRecommendationStyle = () => {
    switch (analysis.new_recommendation) {
      case 'proceed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'review':
        return 'bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/30';
      case 'reject':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-[hsl(var(--young-blue))]/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                Interview Analysis
                <Badge className={getRecommendationStyle()}>
                  {analysis.new_recommendation.charAt(0).toUpperCase() + analysis.new_recommendation.slice(1)}
                </Badge>
              </CardTitle>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Score Change Card - Prominent */}
            <Card className={`border-2 ${getChangeColor()}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    {getChangeIcon()}
                    AI Score Updated
                  </h4>
                  <Badge variant="outline" className={getChangeColor()}>
                    {isPositive ? '+' : ''}{scoreChange.change} pts
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{scoreChange.previous_score}</div>
                    <div className="text-xs text-muted-foreground">Before</div>
                  </div>
                  <div className="text-2xl">→</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{scoreChange.new_score}</div>
                    <div className="text-xs text-muted-foreground">After</div>
                  </div>
                </div>

                {scoreChange.reasons_for_change.length > 0 && (
                  <div className="space-y-1">
                    {scoreChange.reasons_for_change.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold text-[hsl(var(--young-blue))]">
                  {analysis.new_skills_score}
                </div>
                <div className="text-xs text-muted-foreground">Skills</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold text-[hsl(var(--young-gold))]">
                  {analysis.new_communication_score}
                </div>
                <div className="text-xs text-muted-foreground">Communication</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold text-[hsl(var(--young-khaki))]">
                  {analysis.new_cultural_fit_score}
                </div>
                <div className="text-xs text-muted-foreground">Cultural Fit</div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Summary</h4>
              <p className="text-sm text-muted-foreground">{analysis.interview_summary}</p>
            </div>

            {/* Performance Assessment */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Performance Assessment</h4>
              <p className="text-sm text-muted-foreground">{analysis.performance_assessment}</p>
            </div>

            {/* Strengths */}
            {analysis.strengths_demonstrated.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Strengths Demonstrated
                </h4>
                <div className="space-y-1">
                  {analysis.strengths_demonstrated.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-600">•</span>
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concerns */}
            {analysis.concerns_identified.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                  Concerns Identified
                </h4>
                <div className="space-y-1">
                  {analysis.concerns_identified.map((concern, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-[hsl(var(--young-gold))]">•</span>
                      <span>{concern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas Needing Clarification */}
            {analysis.areas_needing_clarification && analysis.areas_needing_clarification.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                  Areas Needing Clarification
                </h4>
                <div className="space-y-1">
                  {analysis.areas_needing_clarification.map((area, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-[hsl(var(--young-blue))]">•</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-2 p-3 bg-[hsl(var(--young-blue))]/10 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                Recommended Next Steps
              </h4>
              <p className="text-sm text-muted-foreground">{analysis.next_steps_recommendation}</p>
            </div>

            {/* Follow-up Questions */}
            {analysis.suggested_follow_up_questions && analysis.suggested_follow_up_questions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Suggested Follow-up Questions</h4>
                <div className="space-y-2">
                  {analysis.suggested_follow_up_questions.map((question, idx) => (
                    <div key={idx} className="p-2 bg-muted/30 rounded text-sm">
                      {idx + 1}. {question}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
