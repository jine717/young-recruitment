import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Award, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Brain,
  MessageSquare,
  Mic,
  Target,
  Shield,
  DollarSign,
  Users,
} from 'lucide-react';
import { FinalEvaluationModal } from './FinalEvaluationModal';
import { useFinalEvaluation, type FinalEvaluation } from '@/hooks/useFinalEvaluation';

interface FinalEvaluationTabProps {
  applicationId: string;
  candidateName: string;
  aiEvaluation: any;
  documentAnalyses: any[] | undefined;
}

export function FinalEvaluationTab({
  applicationId,
  candidateName,
  aiEvaluation,
  documentAnalyses,
}: FinalEvaluationTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  
  const { data: finalEvaluationDoc, isLoading } = useFinalEvaluation(applicationId);
  
  // Check prerequisites
  const hasInitialAnalysis = aiEvaluation?.initial_overall_score != null;
  const hasPostBcqAnalysis = aiEvaluation?.pre_bcq_overall_score != null;
  const hasInterviewAnalysis = documentAnalyses?.some(
    d => (d.document_type as string) === 'interview' && d.status === 'completed'
  );
  
  const allPrerequisitesComplete = hasInitialAnalysis && hasPostBcqAnalysis && hasInterviewAnalysis;
  
  const finalEvaluation = finalEvaluationDoc?.analysis as FinalEvaluation | null;
  const hasFinalEvaluation = finalEvaluationDoc?.status === 'completed' && finalEvaluation;
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'hire': return 'bg-green-500/10 text-green-700 border-green-500/30';
      case 'proceed_with_caution': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
      case 'reject': return 'bg-red-500/10 text-red-700 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'hire': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'proceed_with_caution': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'reject': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Prerequisites Progress */}
      <Card className="shadow-young-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-[hsl(var(--young-blue))]" />
            Prerequisites Status
          </CardTitle>
          <CardDescription>
            Complete all stages before running the final evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              hasInitialAnalysis ? 'bg-green-50/50 border-green-200' : 'bg-muted/30 border-border'
            }`}>
              <div className={`p-2 rounded-lg ${hasInitialAnalysis ? 'bg-green-100' : 'bg-muted'}`}>
                <FileText className={`h-4 w-4 ${hasInitialAnalysis ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Initial Analysis</p>
                <p className="text-xs text-muted-foreground">CV + DISC</p>
              </div>
              {hasInitialAnalysis ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              hasPostBcqAnalysis ? 'bg-green-50/50 border-green-200' : 'bg-muted/30 border-border'
            }`}>
              <div className={`p-2 rounded-lg ${hasPostBcqAnalysis ? 'bg-green-100' : 'bg-muted'}`}>
                <MessageSquare className={`h-4 w-4 ${hasPostBcqAnalysis ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">BCQ Analysis</p>
                <p className="text-xs text-muted-foreground">Overview + BCQ</p>
              </div>
              {hasPostBcqAnalysis ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              hasInterviewAnalysis ? 'bg-green-50/50 border-green-200' : 'bg-muted/30 border-border'
            }`}>
              <div className={`p-2 rounded-lg ${hasInterviewAnalysis ? 'bg-green-100' : 'bg-muted'}`}>
                <Mic className={`h-4 w-4 ${hasInterviewAnalysis ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Interview Analysis</p>
                <p className="text-xs text-muted-foreground">Post-interview</p>
              </div>
              {hasInterviewAnalysis ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Final Evaluation Card */}
      <Card className={`shadow-young-sm border-2 ${
        hasFinalEvaluation 
          ? 'border-[hsl(var(--young-gold))]/50 bg-[hsl(var(--young-gold))]/5' 
          : 'border-border/50'
      }`}>
        {hasFinalEvaluation && finalEvaluation ? (
          <Collapsible open={isResultsOpen} onOpenChange={setIsResultsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[hsl(var(--young-gold))]/20">
                      <Award className="h-5 w-5 text-[hsl(var(--young-gold))]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Final Evaluation</CardTitle>
                      <CardDescription>Comprehensive assessment complete</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{finalEvaluation.final_overall_score}</div>
                        <div className="text-xs text-muted-foreground">Final Score</div>
                      </div>
                      <Badge className={`${getRecommendationColor(finalEvaluation.final_recommendation)} capitalize`}>
                        {getRecommendationIcon(finalEvaluation.final_recommendation)}
                        <span className="ml-1">{finalEvaluation.final_recommendation.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    {isResultsOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {/* Stage Progression */}
                <div className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-sm">Score Progression</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getTrendIcon(finalEvaluation.stage_progression.trend)}
                      <span className="capitalize">{finalEvaluation.stage_progression.trend}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-semibold">
                        {finalEvaluation.stage_progression.initial_score ?? '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">Initial</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex-1 text-center">
                      <div className="text-lg font-semibold">
                        {finalEvaluation.stage_progression.post_bcq_score ?? '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">Post-BCQ</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex-1 text-center">
                      <div className="text-lg font-semibold">
                        {finalEvaluation.stage_progression.interview_score ?? '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">Interview</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex-1 text-center">
                      <div className="text-xl font-bold text-[hsl(var(--young-gold))]">
                        {finalEvaluation.stage_progression.final_score}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">Final</div>
                    </div>
                  </div>
                </div>
                
                {/* Executive Summary */}
                <div>
                  <h4 className="font-medium mb-2">Executive Summary</h4>
                  <p className="text-sm text-muted-foreground">{finalEvaluation.executive_summary}</p>
                </div>
                
                {/* Scores Breakdown */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Technical', value: finalEvaluation.technical_competency },
                    { label: 'Communication', value: finalEvaluation.communication_skills },
                    { label: 'Cultural Fit', value: finalEvaluation.cultural_fit },
                    { label: 'Problem Solving', value: finalEvaluation.problem_solving },
                    { label: 'Leadership', value: finalEvaluation.leadership_potential },
                  ].map((score) => (
                    <div key={score.label} className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-lg font-semibold">{score.value}</div>
                      <div className="text-xs text-muted-foreground">{score.label}</div>
                    </div>
                  ))}
                </div>
                
                {/* Strengths & Concerns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Key Strengths
                    </h4>
                    <ul className="space-y-1">
                      {finalEvaluation.strengths_summary.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Areas of Concern
                    </h4>
                    <ul className="space-y-1">
                      {finalEvaluation.concerns_summary.map((concern, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Hiring Recommendation */}
                <div className="rounded-lg border border-[hsl(var(--young-gold))]/30 bg-[hsl(var(--young-gold))]/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-[hsl(var(--young-gold))]" />
                    <h4 className="font-medium text-sm">Hiring Recommendation</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{finalEvaluation.hiring_recommendation}</p>
                </div>
                
                {/* Additional Insights */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-[hsl(var(--young-blue))]" />
                      <h4 className="font-medium text-sm">Compensation Considerations</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{finalEvaluation.compensation_considerations}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <h4 className="font-medium text-sm">Risk Assessment</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{finalEvaluation.risk_assessment}</p>
                  </div>
                </div>
                
                {/* Onboarding Suggestions */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Onboarding Suggestions</h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {finalEvaluation.onboarding_suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 bg-muted/30 p-2 rounded-lg">
                        <span className="text-[hsl(var(--young-blue))] font-medium">{i + 1}.</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Re-run button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModal(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Re-run Evaluation
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-gold))]/20">
                  <Award className="h-5 w-5 text-[hsl(var(--young-gold))]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Final Evaluation</CardTitle>
                  <CardDescription>
                    Generate a comprehensive final assessment combining all stages
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Final Evaluation Yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  {allPrerequisitesComplete 
                    ? "Ready to generate a comprehensive final evaluation"
                    : "Complete all prerequisite analyses before running the final evaluation"
                  }
                </p>
                <Button
                  onClick={() => setShowModal(true)}
                  disabled={!allPrerequisitesComplete}
                  className="bg-[hsl(var(--young-gold))] hover:bg-[hsl(var(--young-gold))]/90 text-[hsl(var(--young-bold-black))]"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Final Evaluation
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
      
      <FinalEvaluationModal
        open={showModal}
        onOpenChange={setShowModal}
        applicationId={applicationId}
        candidateName={candidateName}
      />
    </div>
  );
}
