import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFunnelAnalytics } from "@/hooks/useFunnelAnalytics";
import { useJobs } from "@/hooks/useJobs";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, TrendingUp, Users, Calendar, FlaskConical } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/hooks/useFunnelTracking";
import { useToast } from "@/hooks/use-toast";
const FunnelAnalyticsCard = () => {
  const [days, setDays] = useState(30);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();
  
  const { data: jobs } = useJobs();
  const { data, isLoading, error, refetch } = useFunnelAnalytics(
    days, 
    selectedJobId === 'all' ? undefined : selectedJobId
  );

  // Simulate a complete application funnel for testing
  const simulateCompleteFunnel = async () => {
    if (!jobs || jobs.length === 0) {
      toast({
        title: "No jobs available",
        description: "Create at least one job to simulate funnel events.",
        variant: "destructive"
      });
      return;
    }

    setIsSimulating(true);
    const testJobId = jobs[0].id;
    const testJobTitle = jobs[0].title;

    try {
      console.log('[Funnel Test] Starting simulation for job:', testJobId);
      
      // Simulate each step of the funnel
      await trackFunnelEvent('jobs_list_viewed', null, { jobCount: jobs.length });
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('job_card_clicked', testJobId, { jobTitle: testJobTitle });
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('job_detail_viewed', testJobId, { jobTitle: testJobTitle });
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('apply_button_clicked', testJobId, { buttonLocation: 'test' });
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('apply_form_loaded', testJobId);
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('form_submitted', testJobId);
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('consent_modal_shown', testJobId);
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('consent_authorization_accepted', testJobId);
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('consent_completed', testJobId);
      await new Promise(r => setTimeout(r, 100));
      
      await trackFunnelEvent('application_completed', testJobId, { applicationId: 'test-sim-' + Date.now() });

      toast({
        title: "Funnel simulation complete",
        description: "All funnel events have been recorded. Refreshing data...",
      });

      // Refetch data to show new events
      await refetch();
    } catch (error) {
      console.error('[Funnel Test] Simulation failed:', error);
      toast({
        title: "Simulation failed",
        description: "Check the console for errors.",
        variant: "destructive"
      });
    } finally {
      setIsSimulating(false);
    }
  };

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
              <Button
                variant="outline"
                size="sm"
                onClick={simulateCompleteFunnel}
                disabled={isSimulating}
                title="Simulate a complete funnel journey for testing"
              >
                <FlaskConical className="h-4 w-4 mr-1" />
                {isSimulating ? 'Simulating...' : 'Test Funnel'}
              </Button>
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
              <div className="space-y-1">
                {data.funnelData.steps.map((step, index) => {
                  const prevStep = index > 0 ? data.funnelData.steps[index - 1] : null;
                  const dropOffRate = prevStep && prevStep.uniqueSessions > 0
                    ? ((prevStep.uniqueSessions - step.uniqueSessions) / prevStep.uniqueSessions * 100)
                    : 0;
                  const maxSessions = data.funnelData.steps[0]?.uniqueSessions || 1;
                  const widthPercent = (step.uniqueSessions / maxSessions) * 100;

                  return (
                    <div key={step.eventType} className="space-y-1">
                      {/* Drop-off indicator between steps */}
                      {index > 0 && dropOffRate > 0 && (
                        <div className="flex items-center justify-end pr-16 py-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowDown className="h-3 w-3 text-destructive" />
                            <span className="text-destructive font-medium">
                              {dropOffRate.toFixed(0)}% drop
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Funnel step row */}
                      <div className="flex items-center gap-4">
                        {/* Label - fixed width, right aligned */}
                        <div className="w-36 shrink-0 text-right">
                          <span className="text-sm font-medium text-foreground">
                            {step.label}
                          </span>
                        </div>
                        
                        {/* Progress bar container - full width */}
                        <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                          <div 
                            className="h-full rounded-md transition-all duration-500 ease-out"
                            style={{ 
                              width: `${Math.max(widthPercent, step.uniqueSessions > 0 ? 3 : 0)}%`,
                              background: `hsl(var(--primary) / ${1 - (index * 0.1)})`
                            }}
                          />
                        </div>
                        
                        {/* Count - fixed width, right aligned */}
                        <div className="w-12 shrink-0 text-right">
                          <span className="text-sm font-bold text-foreground">
                            {step.uniqueSessions}
                          </span>
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

      {/* Daily Trend Chart */}
      {data && data.dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Conversion Trend
            </CardTitle>
            <CardDescription>
              Views and completed applications over the last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.dailyTrend}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium mb-2">
                            {format(parseISO(label), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            Views: {payload[0]?.value || 0}
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(var(--chart-2))' }} />
                            Applications: {payload[1]?.value || 0}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-foreground">
                        {value === 'views' ? 'Job Views' : 'Applications'}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--chart-2))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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
