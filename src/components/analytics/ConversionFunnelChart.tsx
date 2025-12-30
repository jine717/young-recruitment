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
  'hsl(210, 70%, 50%)',  // Evaluated
  'hsl(142, 76%, 36%)',  // Hired (green)
];

/**
 * Render a vertical conversion funnel chart from staged funnel data.
 *
 * The component displays each stage's name, candidate count, overall percentage, a colored horizontal bar sized relative to the largest stage, and (for all but the first stage) the conversion percentage from the previous stage. Bars are colorized from a predefined palette and have a minimum visible width to ensure small values remain visible.
 *
 * @param data - Array of funnel stages; each item should include `stage` (label), `count` (numeric count), and `percentage` (stage percentage) and is rendered in order.
 * @returns The rendered conversion funnel chart as a JSX element.
 */
export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
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
                    <span className="text-muted-foreground">{item.count} candidates</span>
                    <span className="font-semibold">{item.percentage}%</span>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({conversionFromPrevious}% from previous)
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