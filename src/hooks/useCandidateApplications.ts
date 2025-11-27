import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CandidateApplication {
  id: string;
  job_id: string;
  status: 'pending' | 'under_review' | 'interview' | 'rejected' | 'hired';
  cv_url: string | null;
  disc_url: string | null;
  business_case_completed: boolean;
  business_case_completed_at: string | null;
  ai_score: number | null;
  ai_evaluation_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  created_at: string;
  updated_at: string;
  jobs: {
    title: string;
    location: string;
    type: string;
    description: string;
    departments: {
      name: string;
    } | null;
  } | null;
}

export function useCandidateApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidate-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            location,
            type,
            description,
            departments (name)
          )
        `)
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CandidateApplication[];
    },
    enabled: !!user?.id,
  });
}

export function useCandidateApplication(applicationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['candidate-application', applicationId],
    queryFn: async () => {
      if (!applicationId || !user?.id) return null;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            location,
            type,
            description,
            departments (name)
          )
        `)
        .eq('id', applicationId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CandidateApplication | null;
    },
    enabled: !!applicationId && !!user?.id,
  });
}
