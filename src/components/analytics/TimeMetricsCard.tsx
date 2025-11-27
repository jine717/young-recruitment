import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { TimeMetrics } from '@/hooks/useAnalytics';

interface TimeMetricsCardProps {
  metrics: TimeMetrics;
}

export function TimeMetricsCard({ metrics }: TimeMetricsCardProps) {
  const items = [
    {
      label: 'Avg. Time to Hire',
      value: `${metrics.avgTimeToHire} days`,
      icon: Clock,
      description: 'From application to offer',
    },
    {
      label: 'Avg. Time to Interview',
      value: `${metrics.avgTimeToInterview} days`,
      icon: Calendar,
      description: 'From application to first interview',
    },
    {
      label: 'Total Hired',
      value: metrics.totalHired,
      icon: CheckCircle,
      description: 'Successful hires',
    },
    {
      label: 'Hire Rate',
      value: metrics.totalHired + metrics.totalRejected > 0
        ? `${Math.round((metrics.totalHired / (metrics.totalHired + metrics.totalRejected)) * 100)}%`
        : 'N/A',
      icon: TrendingUp,
      description: 'Of completed applications',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time & Conversion Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
