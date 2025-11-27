import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface PipelineData {
  status: string;
  count: number;
}

export interface TimeMetrics {
  avgTimeToHire: number;
  avgTimeToInterview: number;
  avgTimeToReview: number;
  totalHired: number;
  totalRejected: number;
}

export interface RecruiterStats {
  recruiterId: string;
  recruiterName: string;
  interviewsScheduled: number;
  decisionseMade: number;
  notesAdded: number;
}

export interface DepartmentStats {
  departmentName: string;
  applicationCount: number;
  hiredCount: number;
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      // Fetch all applications with their jobs
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('*, jobs(title, department_id, departments(name))');

      if (appError) throw appError;

      // Fetch hiring decisions
      const { data: decisions, error: decError } = await supabase
        .from('hiring_decisions')
        .select('*, applications(created_at)');

      if (decError) throw decError;

      // Fetch interviews
      const { data: interviews, error: intError } = await supabase
        .from('interviews')
        .select('*');

      if (intError) throw intError;

      // Fetch recruiter notes
      const { data: notes, error: notesError } = await supabase
        .from('recruiter_notes')
        .select('*');

      if (notesError) throw notesError;

      // Fetch profiles for recruiter names
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (profError) throw profError;

      // Calculate pipeline data
      const statusCounts: Record<string, number> = {
        pending: 0,
        under_review: 0,
        interview: 0,
        hired: 0,
        rejected: 0,
      };

      applications?.forEach((app) => {
        if (statusCounts[app.status] !== undefined) {
          statusCounts[app.status]++;
        }
      });

      const pipelineData: PipelineData[] = [
        { status: 'Applied', count: statusCounts.pending },
        { status: 'Under Review', count: statusCounts.under_review },
        { status: 'Interview', count: statusCounts.interview },
        { status: 'Hired', count: statusCounts.hired },
        { status: 'Rejected', count: statusCounts.rejected },
      ];

      // Calculate time metrics
      const hiredDecisions = decisions?.filter((d) => d.decision === 'hired') || [];
      const avgTimeToHire =
        hiredDecisions.length > 0
          ? hiredDecisions.reduce((sum, d) => {
              const appCreated = d.applications?.created_at;
              if (appCreated) {
                return sum + differenceInDays(new Date(d.created_at), new Date(appCreated));
              }
              return sum;
            }, 0) / hiredDecisions.length
          : 0;

      // Calculate avg time to first interview
      const appsWithInterviews = applications?.filter((app) =>
        interviews?.some((i) => i.application_id === app.id)
      ) || [];
      
      const avgTimeToInterview =
        appsWithInterviews.length > 0
          ? appsWithInterviews.reduce((sum, app) => {
              const firstInterview = interviews
                ?.filter((i) => i.application_id === app.id)
                .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())[0];
              if (firstInterview) {
                return sum + differenceInDays(new Date(firstInterview.created_at), new Date(app.created_at));
              }
              return sum;
            }, 0) / appsWithInterviews.length
          : 0;

      const timeMetrics: TimeMetrics = {
        avgTimeToHire: Math.round(avgTimeToHire),
        avgTimeToInterview: Math.round(avgTimeToInterview),
        avgTimeToReview: 0, // Would need status change tracking
        totalHired: statusCounts.hired,
        totalRejected: statusCounts.rejected,
      };

      // Calculate recruiter performance
      const recruiterMap = new Map<string, RecruiterStats>();

      interviews?.forEach((interview) => {
        const recruiterId = interview.scheduled_by;
        if (!recruiterMap.has(recruiterId)) {
          const profile = profiles?.find((p) => p.id === recruiterId);
          recruiterMap.set(recruiterId, {
            recruiterId,
            recruiterName: profile?.full_name || profile?.email || 'Unknown',
            interviewsScheduled: 0,
            decisionseMade: 0,
            notesAdded: 0,
          });
        }
        const stats = recruiterMap.get(recruiterId)!;
        stats.interviewsScheduled++;
      });

      decisions?.forEach((decision) => {
        const recruiterId = decision.decision_maker_id;
        if (!recruiterMap.has(recruiterId)) {
          const profile = profiles?.find((p) => p.id === recruiterId);
          recruiterMap.set(recruiterId, {
            recruiterId,
            recruiterName: profile?.full_name || profile?.email || 'Unknown',
            interviewsScheduled: 0,
            decisionseMade: 0,
            notesAdded: 0,
          });
        }
        const stats = recruiterMap.get(recruiterId)!;
        stats.decisionseMade++;
      });

      notes?.forEach((note) => {
        const recruiterId = note.recruiter_id;
        if (!recruiterMap.has(recruiterId)) {
          const profile = profiles?.find((p) => p.id === recruiterId);
          recruiterMap.set(recruiterId, {
            recruiterId,
            recruiterName: profile?.full_name || profile?.email || 'Unknown',
            interviewsScheduled: 0,
            decisionseMade: 0,
            notesAdded: 0,
          });
        }
        const stats = recruiterMap.get(recruiterId)!;
        stats.notesAdded++;
      });

      const recruiterStats = Array.from(recruiterMap.values());

      // Calculate department stats
      const deptMap = new Map<string, DepartmentStats>();

      applications?.forEach((app) => {
        const deptName = (app.jobs as any)?.departments?.name || 'Unassigned';
        if (!deptMap.has(deptName)) {
          deptMap.set(deptName, {
            departmentName: deptName,
            applicationCount: 0,
            hiredCount: 0,
          });
        }
        const stats = deptMap.get(deptName)!;
        stats.applicationCount++;
        if (app.status === 'hired') {
          stats.hiredCount++;
        }
      });

      const departmentStats = Array.from(deptMap.values());

      return {
        pipelineData,
        timeMetrics,
        recruiterStats,
        departmentStats,
        totalApplications: applications?.length || 0,
      };
    },
  });
}
