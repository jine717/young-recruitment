import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AIScoreBadgeProps {
  score: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  size?: 'sm' | 'md';
}

export function AIScoreBadge({ score, status, size = 'md' }: AIScoreBadgeProps) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  
  if (status === 'processing') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            "rounded-full flex items-center justify-center bg-muted",
            sizeClasses
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
            sizeClasses
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
            sizeClasses
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

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={cn(
          "rounded-full flex items-center justify-center font-bold border-2",
          sizeClasses,
          getScoreColor(score)
        )}>
          {score}
        </div>
      </TooltipTrigger>
      <TooltipContent>AI Compatibility Score</TooltipContent>
    </Tooltip>
  );
}
