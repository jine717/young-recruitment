import { Brain, TrendingUp, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickScoreWidgetProps {
  score: number | null;
  recommendation: string | null;
  isLoading?: boolean;
  onClick?: () => void;
}

export function QuickScoreWidget({ score, recommendation, isLoading, onClick }: QuickScoreWidgetProps) {
  const getRecommendationConfig = (rec: string | null) => {
    switch (rec) {
      case 'proceed':
        return {
          label: 'Proceed',
          icon: TrendingUp,
          colorClass: 'text-young-blue',
          bgClass: 'bg-young-blue/10',
          borderClass: 'border-young-blue/30',
        };
      case 'review':
        return {
          label: 'Review',
          icon: AlertCircle,
          colorClass: 'text-young-gold',
          bgClass: 'bg-young-gold/10',
          borderClass: 'border-young-gold/30',
        };
      case 'reject':
        return {
          label: 'Reject',
          icon: XCircle,
          colorClass: 'text-destructive',
          bgClass: 'bg-destructive/10',
          borderClass: 'border-destructive/30',
        };
      default:
        return {
          label: 'Pending',
          icon: Brain,
          colorClass: 'text-muted-foreground',
          bgClass: 'bg-muted',
          borderClass: 'border-border',
        };
    }
  };

  const config = getRecommendationConfig(recommendation);
  const Icon = config.icon;

  if (isLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-3 w-12 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all border-2",
        config.borderClass
      )} 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Score Circle */}
          <div className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center",
            config.bgClass
          )}>
            <span className={cn("text-xl font-bold", config.colorClass)}>
              {score ?? '—'}
            </span>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/30"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(score ?? 0) * 1.5} 150`}
                className={config.colorClass}
              />
            </svg>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">AI Score</p>
            <div className={cn("flex items-center gap-1 font-medium", config.colorClass)}>
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
