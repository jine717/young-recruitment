import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PipelineData } from '@/hooks/useRecruiterAnalytics';

interface HiringPipelineChartProps {
  data: PipelineData[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 70%, 50%)',  // Evaluación
  'hsl(142, 76%, 36%)',  // Contratados (green)
  'hsl(0, 72%, 51%)',    // Rechazados (red)
];

/**
 * Renders a card containing a vertical bar chart that visualizes hiring pipeline counts grouped by status.
 *
 * @param data - Array of pipeline entries where each item includes `status` (category label) and `count` (numeric value) to display as bars.
 * @returns A React element: a Card with a titled header and a responsive vertical BarChart mapping each `status` to a bar colored from the component palette.
 */
export function HiringPipelineChart({ data }: HiringPipelineChartProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Pipeline de Contratación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="status" type="category" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}