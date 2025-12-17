import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApplicationWithDetails {
  id: string;
  candidate_id: string | null;
  candidate_name: string | null;
  candidate_email: string | null;
  job_id: string;
  status: 'pending' | 'under_review' | 'interview' | 'rejected' | 'hired' | 'bcq_sent' | 'interviewed' | 'reviewed';
  cv_url: string | null;
  disc_url: string | null;
  business_case_completed: boolean;
  business_case_completed_at: string | null;
  ai_score: number | null;
  ai_evaluation_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  // BCQ tracking fields
  bcq_delayed: boolean | null;
  bcq_invitation_sent_at: string | null;
  bcq_response_time_minutes: number | null;
  jobs: {
    title: string;
    departments: {
      name: string;
    } | null;
  } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  assigned_recruiter: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      // Fetch applications with jobs
      const { data: applicationsData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            departments (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Fetch profiles for applications that have candidate_id
      const candidateIds = applicationsData
        .filter(app => app.candidate_id)
        .map(app => app.candidate_id);
      
      let profilesMap = new Map();
      
      if (candidateIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', candidateIds);

        if (profilesError) throw profilesError;
        profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      }

      // Fetch profiles for assigned recruiters
      const assignedToIds = applicationsData
        .filter(app => app.assigned_to)
        .map(app => app.assigned_to);
      
      let assignedRecruitersMap = new Map();
      
      if (assignedToIds.length > 0) {
        const { data: recruitersData, error: recruitersError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', assignedToIds);

        if (recruitersError) throw recruitersError;
        assignedRecruitersMap = new Map(recruitersData?.map(r => [r.id, r]) || []);
      }

      // Merge profiles into applications, use candidate_name/email for anonymous apps
      const merged = applicationsData.map(app => ({
        ...app,
        profiles: app.candidate_id 
          ? profilesMap.get(app.candidate_id) || null
          : {
              full_name: app.candidate_name,
              email: app.candidate_email,
              phone: null,
            },
        assigned_recruiter: app.assigned_to 
          ? assignedRecruitersMap.get(app.assigned_to) || null
          : null,
      }));

      return merged as ApplicationWithDetails[];
    },
  });
}

export function useUpdateApplicationStatus() {
  return async (applicationId: string, status: ApplicationWithDetails['status']) => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) throw error;
  };
}

export function useDeleteApplication() {
  return async (applicationId: string) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) throw error;
  };
}