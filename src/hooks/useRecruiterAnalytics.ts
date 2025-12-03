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

export interface TimeMetrics {
  avgToReview: number;
  avgToInterview: number;
  avgToDecision: number;
}

export interface RecruiterAnalyticsData {
  totalApplications: number;
  conversionToInterview: number;
  avgTimeToDecision: number;
  avgAIScore: number | null;
  funnelData: FunnelData[];
  applicationsTrend: TrendData[];
  jobPerformance: JobPerformance[];
  aiScoreDistribution: AIScoreDistribution[];
  timeMetrics: TimeMetrics;
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
  const decisions = data?.decisions || [];
  const interviews = data?.interviews || [];

  // Calculate KPIs
  const totalApplications = applications.length;
  
  const interviewCount = applications.filter(app => 
    app.status === 'interview' || app.status === 'hired'
  ).length;
  const conversionToInterview = totalApplications > 0 
    ? Math.round((interviewCount / totalApplications) * 100) 
    : 0;

  // Average AI Score
  const appsWithScore = applications.filter(app => app.ai_score !== null);
  const avgAIScore = appsWithScore.length > 0
    ? Math.round(appsWithScore.reduce((sum, app) => sum + (app.ai_score || 0), 0) / appsWithScore.length)
    : null;

  // Time to decision (days)
  const decisionsWithTime = decisions.map(d => {
    const app = applications.find(a => a.id === d.application_id);
    if (!app) return null;
    const appDate = new Date(app.created_at);
    const decDate = new Date(d.created_at);
    return Math.ceil((decDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
  }).filter(Boolean) as number[];
  
  const avgTimeToDecision = decisionsWithTime.length > 0
    ? Math.round(decisionsWithTime.reduce((a, b) => a + b, 0) / decisionsWithTime.length)
    : 0;

  // Funnel Data
  const statusCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    interview: applications.filter(a => a.status === 'interview').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const funnelData: FunnelData[] = [
    { stage: 'Applied', count: totalApplications, percentage: 100 },
    { stage: 'Under Review', count: statusCounts.under_review + statusCounts.interview + statusCounts.hired, percentage: totalApplications > 0 ? Math.round(((statusCounts.under_review + statusCounts.interview + statusCounts.hired) / totalApplications) * 100) : 0 },
    { stage: 'Interview', count: statusCounts.interview + statusCounts.hired, percentage: totalApplications > 0 ? Math.round(((statusCounts.interview + statusCounts.hired) / totalApplications) * 100) : 0 },
    { stage: 'Hired', count: statusCounts.hired, percentage: totalApplications > 0 ? Math.round((statusCounts.hired / totalApplications) * 100) : 0 },
  ];

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
    const inInterview = apps.filter(a => a.status === 'interview').length;
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

  // Time Metrics
  const appsWithReview = applications.filter(a => a.status !== 'pending');
  const avgToReview = appsWithReview.length > 0
    ? Math.round(appsWithReview.reduce((sum, app) => {
        const created = new Date(app.created_at);
        const updated = new Date(app.updated_at);
        return sum + Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / appsWithReview.length)
    : 0;

  const interviewsWithTime = interviews.map(int => {
    const app = applications.find(a => a.id === int.application_id);
    if (!app) return null;
    const appDate = new Date(app.created_at);
    const intDate = new Date(int.created_at);
    return Math.ceil((intDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
  }).filter(Boolean) as number[];

  const avgToInterview = interviewsWithTime.length > 0
    ? Math.round(interviewsWithTime.reduce((a, b) => a + b, 0) / interviewsWithTime.length)
    : 0;

  const timeMetrics: TimeMetrics = {
    avgToReview,
    avgToInterview,
    avgToDecision: avgTimeToDecision,
  };

  return {
    totalApplications,
    conversionToInterview,
    avgTimeToDecision,
    avgAIScore,
    funnelData,
    applicationsTrend,
    jobPerformance,
    aiScoreDistribution,
    timeMetrics,
    isLoading,
    error: error as Error | null,
  };
}
