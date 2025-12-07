import { Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIAssistantInsights } from '@/hooks/useAIAssistantInsights';

interface QuickInsightsCardProps {
  insights: AIAssistantInsights | undefined;
  isLoading: boolean;
  isMobile: boolean;
}

export const QuickInsightsCard = ({ insights, isLoading, isMobile }: QuickInsightsCardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 h-16" />
        ))}
      </div>
    );
  }

  if (!insights) return null;

  const stats = [
    {
      label: 'Total Pipeline',
      value: insights.totalApplications,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Review',
      value: insights.pendingReview,
      icon: Clock,
      color: 'text-[hsl(var(--young-gold))]',
      bgColor: 'bg-[hsl(var(--young-gold))]/10',
    },
    {
      label: 'Interviews',
      value: insights.scheduledInterviews,
      icon: Calendar,
      color: 'text-[hsl(var(--young-blue))]',
      bgColor: 'bg-[hsl(var(--young-blue))]/10',
    },
    {
      label: 'This Week',
      value: insights.recentApplications,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className={cn(
      "grid gap-2",
      isMobile ? "grid-cols-2" : "grid-cols-4"
    )}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "rounded-lg p-3 flex items-center gap-2",
            "bg-muted/50 border border-border/50"
          )}
        >
          <div className={cn("p-1.5 rounded-md", stat.bgColor)}>
            <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-none">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
