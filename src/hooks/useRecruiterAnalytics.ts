import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfWeek, format } from 'date-fns';

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  week: string;
  count: number;
}

export interface JobPerformance {
  jobId: string;
  jobTitle: string;
  applications: number;
  avgAIScore: number | null;
  inInterview: number;
  hired: number;
  conversionRate: number;
}

export interface AIScoreDistribution {
  range: string;
  count: number;
  color: string;
  label: string;
}

export interface TimeDuration {
  hours: number;
  minutes: number;
}

export interface TimeMetrics {
  avgToReview: TimeDuration;
  avgToInterview: TimeDuration;
  avgToDecision: TimeDuration;
  avgBCQResponseTime: TimeDuration;
}

export interface BCQMetrics {
  bcqSent: number;
  bcqCompleted: number;
  bcqPending: number;
  completionRate: number;
  avgResponseTimeMinutes: number;
}

export interface PipelineData {
  status: string;
  count: number;
}

export interface RecruiterAnalyticsData {
  totalApplications: number;
  conversionToInterview: number;
  avgTimeToDecision: TimeDuration;
  avgAIScore: number | null;
  funnelData: FunnelData[];
  pipelineData: PipelineData[];
  applicationsTrend: TrendData[];
  jobPerformance: JobPerformance[];
  aiScoreDistribution: AIScoreDistribution[];
  timeMetrics: TimeMetrics;
  bcqMetrics: BCQMetrics;
  totalHired: number;
  totalRejected: number;
  isLoading: boolean;
  error: Error | null;
}

export function useRecruiterAnalytics(): RecruiterAnalyticsData {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recruiter-analytics'],
    queryFn: async () => {
      // Fetch all applications with job info
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (id, title)
        `)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Fetch hiring decisions for time calculations
      const { data: decisions, error: decError } = await supabase
        .from('hiring_decisions')
        .select('*');

      if (decError) throw decError;

      // Fetch interviews
      const { data: interviews, error: intError } = await supabase
        .from('interviews')
        .select('*');

      if (intError) throw intError;

      return { applications: applications || [], decisions: decisions || [], interviews: interviews || [] };
    },
  });

  const applications = data?.applications || [];
  const interviews = data?.interviews || [];

  // Calculate KPIs
  const totalApplications = applications.length;
  
  // Count all applications that have progressed past BCQ stage or are in interview/hired
  const interviewStages = ['interview', 'interviewed', 'evaluated', 'hired'];
  const interviewCount = applications.filter(app => 
    interviewStages.includes(app.status)
  ).length;
  const conversionToInterview = totalApplications > 0 
    ? Math.round((interviewCount / totalApplications) * 100) 
    : 0;

  // Average AI Score
  const appsWithScore = applications.filter(app => app.ai_score !== null);
  const avgAIScore = appsWithScore.length > 0
    ? Math.round(appsWithScore.reduce((sum, app) => sum + (app.ai_score || 0), 0) / appsWithScore.length)
    : null;

  // Helper function to convert minutes to hours and minutes
  const toHoursAndMinutes = (totalMinutes: number): TimeDuration => ({
    hours: Math.floor(totalMinutes / 60),
    minutes: Math.round(totalMinutes % 60),
  });

  // Time to decision - using applications with final status (hired/rejected)
  const appsWithDecision = applications.filter(
    a => a.status === 'hired' || a.status === 'rejected'
  );
  
  const decisionsWithTime = appsWithDecision.map(app => {
    const created = new Date(app.created_at);
    const updated = new Date(app.updated_at);
    return (updated.getTime() - created.getTime()) / (1000 * 60); // minutes
  });
  
  const avgTimeToDecisionMinutes = decisionsWithTime.length > 0
    ? decisionsWithTime.reduce((a, b) => a + b, 0) / decisionsWithTime.length
    : 0;
  const avgTimeToDecision = toHoursAndMinutes(avgTimeToDecisionMinutes);

  // Status counts for all 12 statuses
  const statusCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    bcq_sent: applications.filter(a => a.status === 'bcq_sent').length,
    bcq_received: applications.filter(a => a.status === 'bcq_received').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    pre_interview: applications.filter(a => a.status === 'pre_interview').length,
    interview: applications.filter(a => a.status === 'interview').length,
    interviewed: applications.filter(a => a.status === 'interviewed').length,
    evaluated: applications.filter(a => a.status === 'evaluated').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  // Pipeline data for bar chart (grouped logically)
  const pipelineData: PipelineData[] = [
    { status: 'Nuevos', count: statusCounts.pending },
    { status: 'En Revisión', count: statusCounts.under_review },
    { status: 'BCQ', count: statusCounts.bcq_sent + statusCounts.bcq_received },
    { status: 'Pre-Entrevista', count: statusCounts.reviewed + statusCounts.pre_interview },
    { status: 'Entrevista', count: statusCounts.interview + statusCounts.interviewed },
    { status: 'Evaluación', count: statusCounts.evaluated },
    { status: 'Contratados', count: statusCounts.hired },
    { status: 'Rechazados', count: statusCounts.rejected },
  ];

  // Funnel Data - cumulative progression
  const bcqAndBeyond = statusCounts.bcq_sent + statusCounts.bcq_received + statusCounts.reviewed + 
    statusCounts.pre_interview + statusCounts.interview + statusCounts.interviewed + 
    statusCounts.evaluated + statusCounts.hired;
  const interviewAndBeyond = statusCounts.interview + statusCounts.interviewed + 
    statusCounts.evaluated + statusCounts.hired;
  const evaluatedAndHired = statusCounts.evaluated + statusCounts.hired;

  const funnelData: FunnelData[] = [
    { stage: 'Aplicados', count: totalApplications, percentage: 100 },
    { stage: 'En Revisión', count: totalApplications - statusCounts.pending, percentage: totalApplications > 0 ? Math.round(((totalApplications - statusCounts.pending) / totalApplications) * 100) : 0 },
    { stage: 'BCQ Enviado', count: bcqAndBeyond, percentage: totalApplications > 0 ? Math.round((bcqAndBeyond / totalApplications) * 100) : 0 },
    { stage: 'BCQ Completado', count: statusCounts.bcq_received + statusCounts.reviewed + statusCounts.pre_interview + statusCounts.interview + statusCounts.interviewed + statusCounts.evaluated + statusCounts.hired, percentage: totalApplications > 0 ? Math.round(((statusCounts.bcq_received + statusCounts.reviewed + statusCounts.pre_interview + interviewAndBeyond) / totalApplications) * 100) : 0 },
    { stage: 'Entrevistados', count: interviewAndBeyond, percentage: totalApplications > 0 ? Math.round((interviewAndBeyond / totalApplications) * 100) : 0 },
    { stage: 'Evaluados', count: evaluatedAndHired, percentage: totalApplications > 0 ? Math.round((evaluatedAndHired / totalApplications) * 100) : 0 },
    { stage: 'Contratados', count: statusCounts.hired, percentage: totalApplications > 0 ? Math.round((statusCounts.hired / totalApplications) * 100) : 0 },
  ];

  // BCQ Metrics
  const bcqSent = applications.filter(a => 
    a.bcq_invitation_sent_at !== null
  ).length;
  const bcqCompleted = applications.filter(a => 
    a.business_case_completed === true
  ).length;
  const bcqPending = statusCounts.bcq_sent;
  const completionRate = bcqSent > 0 ? Math.round((bcqCompleted / bcqSent) * 100) : 0;
  
  // Average BCQ response time from the field
  const appsWithBCQTime = applications.filter(a => a.bcq_response_time_minutes !== null);
  const avgBCQResponseTimeMinutes = appsWithBCQTime.length > 0
    ? appsWithBCQTime.reduce((sum, a) => sum + (a.bcq_response_time_minutes || 0), 0) / appsWithBCQTime.length
    : 0;

  const bcqMetrics: BCQMetrics = {
    bcqSent,
    bcqCompleted,
    bcqPending,
    completionRate,
    avgResponseTimeMinutes: Math.round(avgBCQResponseTimeMinutes),
  };

  // Applications Trend (last 8 weeks)
  const applicationsTrend: TrendData[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(new Date(), i * 7));
    const weekEnd = startOfWeek(subDays(new Date(), (i - 1) * 7));
    const count = applications.filter(app => {
      const date = new Date(app.created_at);
      return date >= weekStart && date < weekEnd;
    }).length;
    applicationsTrend.push({
      week: format(weekStart, 'MMM d'),
      count,
    });
  }

  // Job Performance
  const jobMap = new Map<string, { title: string; apps: typeof applications }>();
  applications.forEach(app => {
    const jobId = app.job_id;
    const jobTitle = app.jobs?.title || 'Unknown';
    if (!jobMap.has(jobId)) {
      jobMap.set(jobId, { title: jobTitle, apps: [] });
    }
    jobMap.get(jobId)!.apps.push(app);
  });

  const jobPerformance: JobPerformance[] = Array.from(jobMap.entries()).map(([jobId, data]) => {
    const apps = data.apps;
    const withScore = apps.filter(a => a.ai_score !== null);
    const avgScore = withScore.length > 0
      ? Math.round(withScore.reduce((sum, a) => sum + (a.ai_score || 0), 0) / withScore.length)
      : null;
    const inInterview = apps.filter(a => ['interview', 'interviewed'].includes(a.status)).length;
    const hired = apps.filter(a => a.status === 'hired').length;
    const conversionRate = apps.length > 0 ? Math.round((hired / apps.length) * 100) : 0;

    return {
      jobId,
      jobTitle: data.title,
      applications: apps.length,
      avgAIScore: avgScore,
      inInterview,
      hired,
      conversionRate,
    };
  }).sort((a, b) => b.applications - a.applications);

  // AI Score Distribution - 3 categories: Low (Red), Medium (Orange), High (Green)
  const scoreRanges = [
    { range: '0-40', min: 0, max: 40, color: '#EF4444', label: 'Low' },
    { range: '41-70', min: 41, max: 70, color: '#F97316', label: 'Medium' },
    { range: '71-100', min: 71, max: 100, color: '#22C55E', label: 'High' },
  ];

  const aiScoreDistribution: AIScoreDistribution[] = scoreRanges.map(({ range, min, max, color, label }) => ({
    range,
    count: applications.filter(a => a.ai_score !== null && a.ai_score >= min && a.ai_score <= max).length,
    color,
    label,
  }));

  // Time Metrics (in minutes for precision)
  const appsWithReview = applications.filter(a => a.status !== 'pending');
  const avgToReviewMinutes = appsWithReview.length > 0
    ? appsWithReview.reduce((sum, app) => {
        const created = new Date(app.created_at);
        const updated = new Date(app.updated_at);
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60); // minutes
      }, 0) / appsWithReview.length
    : 0;

  const interviewsWithTime = interviews.map(int => {
    const app = applications.find(a => a.id === int.application_id);
    if (!app) return null;
    const appDate = new Date(app.created_at);
    const intDate = new Date(int.created_at);
    return (intDate.getTime() - appDate.getTime()) / (1000 * 60); // minutes
  }).filter(Boolean) as number[];

  const avgToInterviewMinutes = interviewsWithTime.length > 0
    ? interviewsWithTime.reduce((a, b) => a + b, 0) / interviewsWithTime.length
    : 0;

  const timeMetrics: TimeMetrics = {
    avgToReview: toHoursAndMinutes(avgToReviewMinutes),
    avgToInterview: toHoursAndMinutes(avgToInterviewMinutes),
    avgToDecision: avgTimeToDecision,
    avgBCQResponseTime: toHoursAndMinutes(avgBCQResponseTimeMinutes),
  };

  return {
    totalApplications,
    conversionToInterview,
    avgTimeToDecision,
    avgAIScore,
    funnelData,
    pipelineData,
    applicationsTrend,
    jobPerformance,
    aiScoreDistribution,
    timeMetrics,
    bcqMetrics,
    totalHired: statusCounts.hired,
    totalRejected: statusCounts.rejected,
    isLoading,
    error: error as Error | null,
  };
}
