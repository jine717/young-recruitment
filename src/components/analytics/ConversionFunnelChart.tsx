import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelData } from '@/hooks/useRecruiterAnalytics';

interface ConversionFunnelChartProps {
  data: FunnelData[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 70%, 50%)',  // Evaluados
  'hsl(142, 76%, 36%)',  // Contratados (green)
];

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel de Conversión</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const widthPercent = (item.count / maxCount) * 100;
            const conversionFromPrevious = index > 0 && data[index - 1].count > 0
              ? Math.round((item.count / data[index - 1].count) * 100)
              : 100;

            return (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count} candidatos</span>
                    <span className="font-semibold">{item.percentage}%</span>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({conversionFromPrevious}% del anterior)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(widthPercent, 5)}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  >
                    {widthPercent > 15 && (
                      <span className="text-xs font-medium text-white">{item.count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
