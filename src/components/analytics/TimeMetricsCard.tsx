import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, CheckCircle, FileQuestion } from 'lucide-react';
import { TimeMetrics, TimeDuration } from '@/hooks/useRecruiterAnalytics';

interface TimeMetricsCardProps {
  metrics: TimeMetrics;
  totalHired: number;
  totalRejected: number;
}

// Format duration as hours and minutes
const formatDuration = (time: TimeDuration): string => {
  if (time.hours === 0 && time.minutes === 0) return '0m';
  if (time.hours === 0) return `${time.minutes}m`;
  if (time.minutes === 0) return `${time.hours}h`;
  return `${time.hours}h ${time.minutes}m`;
};

/**
 * Renders a card showing time and conversion metrics for recruiting.
 *
 * Displays average time-to-review, average time-to-interview, average BCQ response time, and a computed hire rate with contextual descriptions and icons.
 *
 * @param metrics - TimeMetrics containing `avgToReview`, `avgToInterview`, and `avgBCQResponseTime` durations used for the displayed time values.
 * @param totalHired - Number of hires used to compute the hire rate and summary.
 * @param totalRejected - Number of rejections used to compute the hire rate and summary.
 * @returns A JSX element containing a titled card with four metric tiles (label, icon, value, and description).
 */
export function TimeMetricsCard({ metrics, totalHired, totalRejected }: TimeMetricsCardProps) {
  const hireRate = totalHired + totalRejected > 0
    ? `${Math.round((totalHired / (totalHired + totalRejected)) * 100)}%`
    : 'N/A';

  const items = [
    {
      label: 'Avg Time to Review',
      value: formatDuration(metrics.avgToReview),
      icon: Clock,
      description: 'From application to first review',
    },
    {
      label: 'Avg Time to Interview',
      value: formatDuration(metrics.avgToInterview),
      icon: Calendar,
      description: 'From application to first interview',
    },
    {
      label: 'BCQ Response Time',
      value: formatDuration(metrics.avgBCQResponseTime),
      icon: FileQuestion,
      description: 'Average time to complete BCQ',
    },
    {
      label: 'Hire Rate',
      value: hireRate,
      icon: TrendingUp,
      description: `${totalHired} hired out of ${totalHired + totalRejected} finalized`,
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