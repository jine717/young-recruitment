import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApplicationWithDetails {
  id: string;
  candidate_id: string;
  job_id: string;
  status: 'pending' | 'under_review' | 'interview' | 'rejected' | 'hired';
  cv_url: string | null;
  disc_url: string | null;
  business_case_completed: boolean;
  business_case_completed_at: string | null;
  created_at: string;
  updated_at: string;
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
}

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      // First fetch applications with jobs
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

      // Fetch profiles for all candidate_ids
      const candidateIds = applicationsData.map(app => app.candidate_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', candidateIds);

      if (profilesError) throw profilesError;

      // Merge profiles into applications
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const merged = applicationsData.map(app => ({
        ...app,
        profiles: profilesMap.get(app.candidate_id) || null,
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
