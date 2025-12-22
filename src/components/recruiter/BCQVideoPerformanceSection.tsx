import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Video, Mic, MessageSquare, ChevronDown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BCQVideoPerformance, CandidateRanking } from '@/hooks/useCandidateComparison';

interface BCQVideoPerformanceSectionProps {
  bcqVideoPerformance: BCQVideoPerformance[];
  rankings: CandidateRanking[];
}

export function BCQVideoPerformanceSection({ bcqVideoPerformance, rankings }: BCQVideoPerformanceSectionProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number | null) => {
    if (score === null) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          BCQ Video Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bcqVideoPerformance.map((candidate) => {
          const ranking = rankings.find(r => r.application_id === candidate.application_id);
          const isTopCandidate = ranking?.rank === 1;

          return (
            <Collapsible key={candidate.application_id} defaultOpen={isTopCandidate}>
              <div
                className={cn(
                  "border rounded-xl transition-all",
                  isTopCandidate
                    ? "border-[hsl(var(--young-gold))] bg-[hsl(var(--young-gold))]/5"
                    : "border-muted/60 hover:border-muted"
                )}
              >
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
                      {candidate.candidate_name}
                      {isTopCandidate && (
                        <Trophy className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge className={cn(
                        "text-xs font-bold",
                        candidate.avg_fluency_score && candidate.avg_fluency_score >= 80 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : candidate.avg_fluency_score && candidate.avg_fluency_score >= 60
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {candidate.avg_fluency_score ?? 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge className={cn(
                        "text-xs font-bold",
                        candidate.avg_content_score && candidate.avg_content_score >= 80 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : candidate.avg_content_score && candidate.avg_content_score >= 60
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {candidate.avg_content_score ?? 'N/A'}
                      </Badge>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="px-4 pb-4">
                  <div className="pt-3 border-t border-muted/30 space-y-4">
                    {/* Fluency Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Pronunciation</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={candidate.fluency_details.pronunciation ?? 0} 
                            className={cn("h-2 flex-1", getProgressColor(candidate.fluency_details.pronunciation))}
                          />
                          <span className={cn("text-sm font-medium tabular-nums", getScoreColor(candidate.fluency_details.pronunciation))}>
                            {candidate.fluency_details.pronunciation ?? '-'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Pace</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={candidate.fluency_details.pace ?? 0} 
                            className={cn("h-2 flex-1", getProgressColor(candidate.fluency_details.pace))}
                          />
                          <span className={cn("text-sm font-medium tabular-nums", getScoreColor(candidate.fluency_details.pace))}>
                            {candidate.fluency_details.pace ?? '-'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Hesitation</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={candidate.fluency_details.hesitation ?? 0} 
                            className={cn("h-2 flex-1", getProgressColor(candidate.fluency_details.hesitation))}
                          />
                          <span className={cn("text-sm font-medium tabular-nums", getScoreColor(candidate.fluency_details.hesitation))}>
                            {candidate.fluency_details.hesitation ?? '-'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Grammar</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={candidate.fluency_details.grammar ?? 0} 
                            className={cn("h-2 flex-1", getProgressColor(candidate.fluency_details.grammar))}
                          />
                          <span className={cn("text-sm font-medium tabular-nums", getScoreColor(candidate.fluency_details.grammar))}>
                            {candidate.fluency_details.grammar ?? '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Individual Responses */}
                    {candidate.responses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Response Details</p>
                        {candidate.responses.map((response, idx) => (
                          <div key={idx} className="bg-muted/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{response.question_title}</p>
                              <div className="flex items-center gap-2">
                                {response.fluency_score !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    Fluency: {response.fluency_score}
                                  </Badge>
                                )}
                                {response.content_score !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    Content: {response.content_score}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {response.content_summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {response.content_summary}
                              </p>
                            )}
                            {response.transcription_excerpt && (
                              <p className="text-xs italic text-muted-foreground/80 line-clamp-2">
                                "{response.transcription_excerpt}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}