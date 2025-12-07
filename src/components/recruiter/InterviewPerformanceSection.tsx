import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import type { InterviewPerformanceAnalysis, CandidateRanking } from '@/hooks/useCandidateComparison';
import { cn } from '@/lib/utils';

interface InterviewPerformanceSectionProps {
  interviewAnalysis: InterviewPerformanceAnalysis[];
  rankings: CandidateRanking[];
}

export function InterviewPerformanceSection({ interviewAnalysis, rankings }: InterviewPerformanceSectionProps) {
  // Filter to only show candidates with interview data
  const candidatesWithInterviews = interviewAnalysis.filter(c => c.has_interview);
  const candidatesWithoutInterviews = interviewAnalysis.filter(c => !c.has_interview);

  const getPerformanceBadge = (performance?: string) => {
    if (!performance) return null;
    
    const lowerPerf = performance.toLowerCase();
    if (lowerPerf.includes('exceed')) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <TrendingUp className="w-3 h-3 mr-1" />
          Exceeded Expectations
        </Badge>
      );
    }
    if (lowerPerf.includes('below') || lowerPerf.includes('disappoint')) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <TrendingDown className="w-3 h-3 mr-1" />
          Below Expectations
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Minus className="w-3 h-3 mr-1" />
        Met Expectations
      </Badge>
    );
  };

  const getScoreChangeIndicator = (change?: number) => {
    if (change === undefined || change === null) return null;
    
    if (change > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
          <TrendingUp className="w-4 h-4" />
          +{change}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
          <TrendingDown className="w-4 h-4" />
          {change}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-muted-foreground font-semibold">
        <Minus className="w-4 h-4" />
        0
      </span>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (interviewAnalysis.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Interview Performance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {candidatesWithInterviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidatesWithInterviews.map((candidate) => {
              const ranking = rankings.find(r => r.application_id === candidate.application_id);
              const isTopCandidate = ranking?.rank === 1;
              
              return (
                <div
                  key={candidate.application_id}
                  className={cn(
                    "rounded-xl border p-4 space-y-4 transition-all",
                    isTopCandidate 
                      ? "bg-[#B88F5E]/5 border-[#B88F5E]/30 shadow-sm" 
                      : "bg-muted/30 border-muted/50 hover:bg-muted/40"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        isTopCandidate 
                          ? "bg-[#B88F5E]/20 text-[#B88F5E]" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        #{ranking?.rank || '-'}
                      </div>
                      <span className="font-semibold text-sm">{candidate.candidate_name}</span>
                    </div>
                    {candidate.interview_score !== undefined && (
                      <div className={cn("text-2xl font-bold tabular-nums", getScoreColor(candidate.interview_score))}>
                        {candidate.interview_score}
                      </div>
                    )}
                  </div>

                  {/* Performance Badge */}
                  {candidate.application_vs_interview && (
                    <div>
                      {getPerformanceBadge(candidate.application_vs_interview)}
                    </div>
                  )}

                  {/* Score Trajectory */}
                  {candidate.score_trajectory && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Change</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{candidate.score_trajectory.initial_score}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={cn("font-semibold", getScoreColor(candidate.score_trajectory.final_score))}>
                            {candidate.score_trajectory.final_score}
                          </span>
                        </div>
                        {getScoreChangeIndicator(candidate.score_trajectory.change)}
                      </div>
                      {candidate.score_trajectory.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {candidate.score_trajectory.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Strengths */}
                  {candidate.strengths_demonstrated && candidate.strengths_demonstrated.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Strengths Demonstrated
                      </p>
                      <ul className="space-y-1">
                        {candidate.strengths_demonstrated.slice(0, 3).map((strength, idx) => (
                          <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span className="leading-relaxed">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {candidate.concerns_raised && candidate.concerns_raised.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        Concerns Raised
                      </p>
                      <ul className="space-y-1">
                        {candidate.concerns_raised.slice(0, 3).map((concern, idx) => (
                          <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span className="leading-relaxed">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Observations */}
                  {candidate.key_observations && candidate.key_observations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        Key Observations
                      </p>
                      <ul className="space-y-1">
                        {candidate.key_observations.slice(0, 3).map((obs, idx) => (
                          <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="leading-relaxed">{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No Interview Data Available</p>
            <p className="text-sm">None of the selected candidates have completed interviews yet.</p>
          </div>
        )}

        {/* Candidates without interviews */}
        {candidatesWithoutInterviews.length > 0 && candidatesWithInterviews.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Candidates Without Interview Data:
              </p>
              <div className="flex flex-wrap gap-2">
                {candidatesWithoutInterviews.map((candidate) => (
                  <Badge key={candidate.application_id} variant="outline" className="text-muted-foreground">
                    {candidate.candidate_name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
