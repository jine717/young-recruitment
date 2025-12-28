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

export function TimeMetricsCard({ metrics, totalHired, totalRejected }: TimeMetricsCardProps) {
  const hireRate = totalHired + totalRejected > 0
    ? `${Math.round((totalHired / (totalHired + totalRejected)) * 100)}%`
    : 'N/A';

  const items = [
    {
      label: 'Tiempo Promedio a Revisión',
      value: formatDuration(metrics.avgToReview),
      icon: Clock,
      description: 'Desde aplicación a primera revisión',
    },
    {
      label: 'Tiempo Promedio a Entrevista',
      value: formatDuration(metrics.avgToInterview),
      icon: Calendar,
      description: 'Desde aplicación a primera entrevista',
    },
    {
      label: 'Tiempo Respuesta BCQ',
      value: formatDuration(metrics.avgBCQResponseTime),
      icon: FileQuestion,
      description: 'Tiempo promedio que tardan en completar BCQ',
    },
    {
      label: 'Tasa de Contratación',
      value: hireRate,
      icon: TrendingUp,
      description: `${totalHired} contratados de ${totalHired + totalRejected} finalizados`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Tiempo y Conversión</CardTitle>
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
