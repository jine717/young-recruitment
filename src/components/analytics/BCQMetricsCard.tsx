import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { BCQMetrics, TimeDuration } from '@/hooks/useRecruiterAnalytics';

interface BCQMetricsCardProps {
  metrics: BCQMetrics;
}

// Format minutes to hours and minutes
const formatMinutes = (minutes: number): string => {
  if (minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export function BCQMetricsCard({ metrics }: BCQMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5" />
          BCQ Metrics (Business Case Questions)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileQuestion className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold">{metrics.bcqSent}</p>
            <p className="text-sm text-muted-foreground">BCQ Sent</p>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{metrics.bcqCompleted}</p>
            <p className="text-sm text-muted-foreground">BCQ Completed</p>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-3xl font-bold">{metrics.bcqPending}</p>
            <p className="text-sm text-muted-foreground">BCQ Pending</p>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{formatMinutes(metrics.avgResponseTimeMinutes)}</p>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
          </div>
        </div>
        
        {/* Completion Rate Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completion Rate</span>
            <span className="text-sm font-bold">{metrics.completionRate}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.bcqCompleted} of {metrics.bcqSent} candidates completed BCQ
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
