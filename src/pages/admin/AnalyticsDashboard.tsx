import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCard } from '@/components/analytics/StatsCard';
import { HiringPipelineChart } from '@/components/analytics/HiringPipelineChart';
import { TimeMetricsCard } from '@/components/analytics/TimeMetricsCard';
import { RecruiterPerformanceTable } from '@/components/analytics/RecruiterPerformanceTable';
import { DepartmentStatsChart } from '@/components/analytics/DepartmentStatsChart';
import { Users, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsDashboard() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
            <p className="text-muted-foreground">
              Track hiring metrics and team performance
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[400px] col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const hiredCount = data?.pipelineData.find((p) => p.status === 'Hired')?.count || 0;
  const rejectedCount = data?.pipelineData.find((p) => p.status === 'Rejected')?.count || 0;
  const interviewCount = data?.pipelineData.find((p) => p.status === 'Interview')?.count || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Track hiring metrics and team performance
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Applications"
            value={data?.totalApplications || 0}
            subtitle="All time"
            icon={Users}
          />
          <StatsCard
            title="In Interview Stage"
            value={interviewCount}
            subtitle="Currently active"
            icon={Briefcase}
          />
          <StatsCard
            title="Total Hired"
            value={hiredCount}
            subtitle="Successful placements"
            icon={CheckCircle}
          />
          <StatsCard
            title="Total Rejected"
            value={rejectedCount}
            subtitle="Not selected"
            icon={XCircle}
          />
        </div>

        {/* Pipeline and Time Metrics */}
        <div className="grid gap-6 lg:grid-cols-3">
          <HiringPipelineChart data={data?.pipelineData || []} />
          <TimeMetricsCard
            metrics={
              data?.timeMetrics || {
                avgTimeToHire: 0,
                avgTimeToInterview: 0,
                avgTimeToReview: 0,
                totalHired: 0,
                totalRejected: 0,
              }
            }
          />
        </div>

        {/* Department Stats and Recruiter Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DepartmentStatsChart data={data?.departmentStats || []} />
          <RecruiterPerformanceTable data={data?.recruiterStats || []} />
        </div>
      </div>
    </AdminLayout>
  );
}
