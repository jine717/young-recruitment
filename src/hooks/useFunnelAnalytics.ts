import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

export interface FunnelStep {
  eventType: string;
  label: string;
  count: number;
  uniqueSessions: number;
}

export interface FunnelData {
  steps: FunnelStep[];
  totalSessions: number;
  conversionRate: number;
}

export interface FunnelAnalyticsData {
  funnelData: FunnelData;
  jobBreakdown: {
    jobId: string;
    jobTitle: string;
    viewCount: number;
    applyClicks: number;
    completedApplications: number;
    conversionRate: number;
  }[];
  dailyTrend: {
    date: string;
    views: number;
    applications: number;
  }[];
}

const FUNNEL_STEPS_ORDER = [
  { eventType: 'jobs_list_viewed', label: 'Viewed Jobs List' },
  { eventType: 'job_detail_viewed', label: 'Viewed Job Details' },
  { eventType: 'apply_button_clicked', label: 'Clicked Apply' },
  { eventType: 'apply_form_loaded', label: 'Started Form' },
  { eventType: 'form_submitted', label: 'Submitted Form' },
  { eventType: 'consent_modal_shown', label: 'Consent Modal Shown' },
  { eventType: 'consent_authorization_accepted', label: 'Authorization Accepted' },
  { eventType: 'consent_completed', label: 'Consent Completed' },
  { eventType: 'application_completed', label: 'Application Completed' }
];

export const useFunnelAnalytics = (days: number = 30, jobId?: string) => {
  return useQuery({
    queryKey: ['funnel-analytics', days, jobId],
    queryFn: async (): Promise<FunnelAnalyticsData> => {
      const startDate = startOfDay(subDays(new Date(), days));
      
      // Build query
      let query = supabase
        .from('funnel_events')
        .select('*')
        .gte('created_at', startDate.toISOString());
      
      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      // Calculate funnel steps
      const eventCounts: Record<string, { count: number; sessions: Set<string> }> = {};
      const allSessions = new Set<string>();

      events?.forEach(event => {
        allSessions.add(event.session_id);
        
        if (!eventCounts[event.event_type]) {
          eventCounts[event.event_type] = { count: 0, sessions: new Set() };
        }
        eventCounts[event.event_type].count++;
        eventCounts[event.event_type].sessions.add(event.session_id);
      });

      const steps: FunnelStep[] = FUNNEL_STEPS_ORDER.map(step => ({
        eventType: step.eventType,
        label: step.label,
        count: eventCounts[step.eventType]?.count || 0,
        uniqueSessions: eventCounts[step.eventType]?.sessions.size || 0
      }));

      // Calculate job breakdown
      const jobEvents: Record<string, {
        jobTitle: string;
        views: number;
        applyClicks: number;
        completed: number;
      }> = {};

      // Fetch job titles
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title');
      
      const jobTitles = new Map(jobs?.map(j => [j.id, j.title]) || []);

      events?.forEach(event => {
        if (!event.job_id) return;
        
        if (!jobEvents[event.job_id]) {
          jobEvents[event.job_id] = {
            jobTitle: jobTitles.get(event.job_id) || 'Unknown',
            views: 0,
            applyClicks: 0,
            completed: 0
          };
        }

        if (event.event_type === 'job_detail_viewed') {
          jobEvents[event.job_id].views++;
        } else if (event.event_type === 'apply_button_clicked') {
          jobEvents[event.job_id].applyClicks++;
        } else if (event.event_type === 'application_completed') {
          jobEvents[event.job_id].completed++;
        }
      });

      const jobBreakdown = Object.entries(jobEvents).map(([id, data]) => ({
        jobId: id,
        jobTitle: data.jobTitle,
        viewCount: data.views,
        applyClicks: data.applyClicks,
        completedApplications: data.completed,
        conversionRate: data.views > 0 ? (data.completed / data.views) * 100 : 0
      })).sort((a, b) => b.viewCount - a.viewCount);

      // Calculate daily trend (last 14 days)
      const dailyData: Record<string, { views: number; applications: number }> = {};
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyData[date] = { views: 0, applications: 0 };
      }

      events?.forEach(event => {
        const date = format(new Date(event.created_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          if (event.event_type === 'job_detail_viewed') {
            dailyData[date].views++;
          } else if (event.event_type === 'application_completed') {
            dailyData[date].applications++;
          }
        }
      });

      const dailyTrend = Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate overall conversion rate
      const firstStep = steps[0]?.uniqueSessions || 0;
      const lastStep = steps[steps.length - 1]?.uniqueSessions || 0;
      const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;

      return {
        funnelData: {
          steps,
          totalSessions: allSessions.size,
          conversionRate
        },
        jobBreakdown,
        dailyTrend
      };
    }
  });
};
