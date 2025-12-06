import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Sparkles, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AIScoreBadgeProps {
  score: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  size?: 'sm' | 'md';
  initialScore?: number | null;
  evaluationStage?: 'initial' | 'post_interview' | null;
}

export function AIScoreBadge({ 
  score, 
  status, 
  size = 'md',
  initialScore = null,
  evaluationStage = null
}: AIScoreBadgeProps) {
  const sizeClasses = size === 'sm' ? 'min-w-8 h-8 text-xs px-1.5' : 'min-w-12 h-12 text-sm px-2';
  
  if (status === 'processing') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            "rounded-full flex items-center justify-center bg-muted",
            size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
          )}>
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>AI analysis in progress...</TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'failed') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            "rounded-full flex items-center justify-center bg-destructive/20",
            size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
          )}>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </div>
        </TooltipTrigger>
        <TooltipContent>AI analysis failed</TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'pending' || score === null) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            "rounded-full flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30",
            size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
          )}>
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>Awaiting AI analysis</TooltipContent>
      </Tooltip>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500/20 text-green-700 border-green-500/50';
    if (score >= 40) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
    return 'bg-red-500/20 text-red-700 border-red-500/50';
  };

  const isPostInterview = evaluationStage === 'post_interview';
  const scoreChange = isPostInterview && initialScore !== null ? score - initialScore : null;

  // Post-interview badge with score change
  if (isPostInterview && initialScore !== null) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1">
            <div className={cn(
              "rounded-full flex items-center justify-center font-bold border-2 gap-0.5",
              sizeClasses,
              getScoreColor(score)
            )}>
              <span className="text-muted-foreground/60 line-through text-[0.65em]">{initialScore}</span>
              <span>→</span>
              <span>{score}</span>
            </div>
            <div className="flex items-center">
              {scoreChange !== null && scoreChange !== 0 && (
                <span className={cn(
                  "text-[0.65em] font-medium",
                  scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {scoreChange > 0 ? '+' : ''}{scoreChange}
                </span>
              )}
              <Users className="w-3 h-3 ml-0.5 text-[hsl(var(--young-blue))]" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Post-Interview Score</p>
            <p className="text-xs text-muted-foreground">
              Initial: {initialScore} → Final: {score}
              {scoreChange !== null && ` (${scoreChange > 0 ? '+' : ''}${scoreChange})`}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Standard score badge
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={cn(
          "rounded-full flex items-center justify-center font-bold border-2",
          size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm',
          getScoreColor(score)
        )}>
          {score}
        </div>
      </TooltipTrigger>
      <TooltipContent>AI Compatibility Score (Initial)</TooltipContent>
    </Tooltip>
  );
}