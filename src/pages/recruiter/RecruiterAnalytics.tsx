import { Link } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Clock, Brain, Timer, CalendarCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecruiterAnalytics, TimeDuration } from '@/hooks/useRecruiterAnalytics';
import { StatsCard } from '@/components/analytics/StatsCard';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { ApplicationsTrendChart } from '@/components/analytics/ApplicationsTrendChart';
import { AIScoreDistributionChart } from '@/components/analytics/AIScoreDistributionChart';
import { JobPerformanceTable } from '@/components/analytics/JobPerformanceTable';
// import FunnelAnalyticsCard from '@/components/analytics/FunnelAnalyticsCard'; // Temporarily hidden while collecting data
import { useRoleCheck } from '@/hooks/useRoleCheck';

// Format duration as hours and minutes
const formatDuration = (time: TimeDuration): string => {
  if (time.hours === 0 && time.minutes === 0) return '0m';
  if (time.hours === 0) return `${time.minutes}m`;
  if (time.minutes === 0) return `${time.hours}h`;
  return `${time.hours}h ${time.minutes}m`;
};

export default function RecruiterAnalytics() {
  const { hasAccess, isLoading: roleLoading } = useRoleCheck(['management', 'admin']);
  const analytics = useRecruiterAnalytics();

  if (roleLoading || analytics.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to view this page.</p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout showDashboardLink>
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Recruitment performance insights</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Applications"
            value={analytics.totalApplications}
            icon={Users}
            subtitle="All time"
          />
          <StatsCard
            title="Interview Conversion"
            value={`${analytics.conversionToInterview}%`}
            icon={TrendingUp}
            subtitle="Applications → Interview"
          />
          <StatsCard
            title="Avg. Time to Decision"
            value={formatDuration(analytics.avgTimeToDecision)}
            icon={Clock}
            subtitle="Application to final decision"
          />
          <StatsCard
            title="Avg. AI Score"
            value={analytics.avgAIScore !== null ? analytics.avgAIScore : '—'}
            icon={Brain}
            subtitle="Candidate quality indicator"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ConversionFunnelChart data={analytics.funnelData} />
          <ApplicationsTrendChart data={analytics.applicationsTrend} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AIScoreDistributionChart data={analytics.aiScoreDistribution} />
          
          {/* Time Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Timer className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Avg. Time to Review</p>
                      <p className="text-sm text-muted-foreground">From application to first review</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{formatDuration(analytics.timeMetrics.avgToReview)}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CalendarCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Avg. Time to Interview</p>
                      <p className="text-sm text-muted-foreground">From application to interview scheduled</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{formatDuration(analytics.timeMetrics.avgToInterview)}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Avg. Time to Decision</p>
                      <p className="text-sm text-muted-foreground">From application to final decision</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{formatDuration(analytics.timeMetrics.avgToDecision)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Performance Table */}
        <JobPerformanceTable data={analytics.jobPerformance} />

        {/* Candidate Journey Funnel - Temporarily hidden while collecting data
        <div className="mt-6">
          <FunnelAnalyticsCard />
        </div>
        */}
      </div>
    </DashboardLayout>
  );
}
