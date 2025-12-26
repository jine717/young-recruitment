import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFunnelAnalytics } from "@/hooks/useFunnelAnalytics";
import { useJobs } from "@/hooks/useJobs";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, TrendingDown, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FunnelAnalyticsCard = () => {
  const [days, setDays] = useState(30);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  
  const { data: jobs } = useJobs();
  const { data, isLoading, error } = useFunnelAnalytics(
    days, 
    selectedJobId === 'all' ? undefined : selectedJobId
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Funnel</CardTitle>
          <CardDescription>Error loading funnel data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Funnel Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Candidate Journey Funnel
              </CardTitle>
              <CardDescription>
                Track where candidates drop off in the application process
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs?.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {data.funnelData.totalSessions}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {data.funnelData.steps[0]?.uniqueSessions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Started Journey</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.funnelData.steps[data.funnelData.steps.length - 1]?.uniqueSessions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {data.funnelData.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
              </div>

              {/* Funnel Visualization */}
              <div className="space-y-2">
                {data.funnelData.steps.map((step, index) => {
                  const prevStep = index > 0 ? data.funnelData.steps[index - 1] : null;
                  const dropOffRate = prevStep && prevStep.uniqueSessions > 0
                    ? ((prevStep.uniqueSessions - step.uniqueSessions) / prevStep.uniqueSessions * 100)
                    : 0;
                  const widthPercent = data.funnelData.steps[0]?.uniqueSessions 
                    ? (step.uniqueSessions / data.funnelData.steps[0].uniqueSessions * 100)
                    : 0;

                  return (
                    <div key={step.eventType}>
                      {index > 0 && dropOffRate > 0 && (
                        <div className="flex items-center gap-2 text-sm text-destructive py-1 pl-4">
                          <TrendingDown className="h-3 w-3" />
                          <span>{dropOffRate.toFixed(1)}% drop-off</span>
                        </div>
                      )}
                      <div className="relative">
                        <div 
                          className="h-12 bg-primary/20 rounded-lg flex items-center px-4 transition-all"
                          style={{ width: `${Math.max(widthPercent, 10)}%` }}
                        >
                          <div 
                            className="absolute inset-0 bg-primary rounded-lg transition-all"
                            style={{ width: `${widthPercent}%`, maxWidth: '100%' }}
                          />
                          <div className="relative z-10 flex items-center justify-between w-full text-primary-foreground font-medium">
                            <span className="text-sm">{step.label}</span>
                            <span className="text-sm font-bold">{step.uniqueSessions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No funnel data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Performance Breakdown */}
      {data && data.jobBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Job</CardTitle>
            <CardDescription>
              Conversion rates for each job posting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.jobBreakdown.slice(0, 10)} 
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="jobTitle" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            Views: {data.viewCount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Apply Clicks: {data.applyClicks}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Completed: {data.completedApplications}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            Conversion: {data.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar 
                    dataKey="conversionRate" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  >
                    {data.jobBreakdown.slice(0, 10).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.conversionRate > 10 
                          ? 'hsl(var(--chart-2))' 
                          : entry.conversionRate > 5 
                            ? 'hsl(var(--chart-4))' 
                            : 'hsl(var(--chart-1))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FunnelAnalyticsCard;
