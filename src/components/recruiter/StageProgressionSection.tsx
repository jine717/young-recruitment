import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StageProgression, PhaseCompletionStatus, CandidateRanking } from '@/hooks/useCandidateComparison';

interface StageProgressionSectionProps {
  stageProgression: StageProgression[];
  phaseCompletion?: PhaseCompletionStatus[];
  rankings: CandidateRanking[];
}

export function StageProgressionSection({ stageProgression, phaseCompletion, rankings }: StageProgressionSectionProps) {
  const getTrendIcon = (trend: StageProgression['progression_trend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-yellow-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: StageProgression['progression_trend'], change: number | null) => {
    const colors = {
      improving: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      declining: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      stable: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      unknown: 'bg-muted text-muted-foreground',
    };

    return (
      <Badge className={cn("text-xs font-medium", colors[trend])}>
        {trend === 'improving' && change ? `+${change}` : 
         trend === 'declining' && change ? `${change}` : 
         trend.charAt(0).toUpperCase() + trend.slice(1)}
      </Badge>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground bg-muted/50';
    if (score >= 80) return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Stage Progression Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Progression Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Candidate</th>
                <th className="text-center py-2 font-medium">
                  <span className="text-xs">Phase 1</span>
                  <p className="text-[10px] text-muted-foreground font-normal">Initial</p>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="text-xs">Phase 2</span>
                  <p className="text-[10px] text-muted-foreground font-normal">Post-BCQ</p>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="text-xs">Phase 3</span>
                  <p className="text-[10px] text-muted-foreground font-normal">Post-Interview</p>
                </th>
                <th className="text-center py-2 font-medium">
                  <span className="text-xs">Phase 4</span>
                  <p className="text-[10px] text-muted-foreground font-normal">Final</p>
                </th>
                <th className="text-center py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {stageProgression.map((candidate) => {
                const ranking = rankings.find(r => r.application_id === candidate.application_id);
                const isTopCandidate = ranking?.rank === 1;

                return (
                  <tr 
                    key={candidate.application_id}
                    className={cn(
                      "border-b last:border-0",
                      isTopCandidate && "bg-[hsl(var(--young-gold))]/5"
                    )}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{candidate.candidate_name}</span>
                        {isTopCandidate && <Trophy className="w-3.5 h-3.5 text-[hsl(var(--young-gold))]" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stage: {candidate.evaluation_stage}
                      </p>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold tabular-nums",
                          getScoreColor(candidate.initial_score)
                        )}>
                          {candidate.initial_score ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        {candidate.initial_score !== null && candidate.post_bcq_score !== null && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                        )}
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold tabular-nums",
                          getScoreColor(candidate.post_bcq_score)
                        )}>
                          {candidate.post_bcq_score ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        {candidate.post_bcq_score !== null && candidate.post_interview_score !== null && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                        )}
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold tabular-nums",
                          getScoreColor(candidate.post_interview_score)
                        )}>
                          {candidate.post_interview_score ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        {candidate.post_interview_score !== null && candidate.final_score !== null && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                        )}
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold tabular-nums",
                          getScoreColor(candidate.final_score)
                        )}>
                          {candidate.final_score ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-2">
                        {getTrendIcon(candidate.progression_trend)}
                        {getTrendBadge(candidate.progression_trend, candidate.score_change)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phase Completion Status */}
        {phaseCompletion && phaseCompletion.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Phase Completion Status</p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {phaseCompletion.map((candidate) => {
                const ranking = rankings.find(r => r.application_id === candidate.application_id);
                const isTopCandidate = ranking?.rank === 1;

                return (
                  <div 
                    key={candidate.application_id}
                    className={cn(
                      "p-3 rounded-lg border",
                      isTopCandidate 
                        ? "border-[hsl(var(--young-gold))] bg-[hsl(var(--young-gold))]/5" 
                        : "border-muted/60"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {candidate.candidate_name}
                        {isTopCandidate && <Trophy className="w-3.5 h-3.5 text-[hsl(var(--young-gold))]" />}
                      </span>
                      <Badge className={cn("text-xs", getCompletionColor(candidate.completion_percentage))}>
                        {candidate.completion_percentage}%
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <div className={cn(
                        "flex-1 h-2 rounded-full",
                        candidate.phases_completed.initial_screening 
                          ? "bg-green-500" 
                          : "bg-muted"
                      )} title="Initial Screening" />
                      <div className={cn(
                        "flex-1 h-2 rounded-full",
                        candidate.phases_completed.bcq_assessment 
                          ? "bg-green-500" 
                          : "bg-muted"
                      )} title="BCQ Assessment" />
                      <div className={cn(
                        "flex-1 h-2 rounded-full",
                        candidate.phases_completed.interview 
                          ? "bg-green-500" 
                          : "bg-muted"
                      )} title="Interview" />
                      <div className={cn(
                        "flex-1 h-2 rounded-full",
                        candidate.phases_completed.final_evaluation 
                          ? "bg-green-500" 
                          : "bg-muted"
                      )} title="Final Evaluation" />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                      <span>Initial</span>
                      <span>BCQ</span>
                      <span>Interview</span>
                      <span>Final</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}