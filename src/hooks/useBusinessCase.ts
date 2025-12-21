import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessCase {
  id: string;
  job_id: string;
  question_number: number;
  question_title: string;
  question_description: string;
  video_url: string | null;
  has_text_response: boolean;
}

export interface BusinessCaseResponse {
  id: string;
  application_id: string;
  business_case_id: string;
  video_url: string | null;
  text_response: string | null;
  completed_at: string | null;
  created_at: string;
  transcription: string | null;
  // Fluency analysis fields
  fluency_pronunciation_score: number | null;
  fluency_pace_score: number | null;
  fluency_hesitation_score: number | null;
  fluency_grammar_score: number | null;
  fluency_overall_score: number | null;
  fluency_notes: string | null;
  // Content analysis fields
  content_quality_score: number | null;
  content_strengths: string[] | null;
  content_areas_to_probe: string[] | null;
  content_summary: string | null;
  content_analysis_status: string | null;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  business_case_completed: boolean;
  jobs?: {
    title: string;
  } | null;
}

export function useApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (title)
        `)
        .eq('id', applicationId)
        .maybeSingle();

      if (error) throw error;
      return data as Application | null;
    },
    enabled: !!applicationId,
  });
}

export function useBusinessCases(jobId: string | undefined) {
  return useQuery({
    queryKey: ['business-cases', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('business_cases')
        .select('*')
        .eq('job_id', jobId)
        .order('question_number', { ascending: true });

      if (error) throw error;
      return data as BusinessCase[];
    },
    enabled: !!jobId,
  });
}

export function useBusinessCaseResponses(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['business-case-responses', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('business_case_responses')
        .select('*')
        .eq('application_id', applicationId);

      if (error) throw error;
      return data as BusinessCaseResponse[];
    },
    enabled: !!applicationId,
  });
}

export function useSubmitBusinessCaseResponse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      applicationId,
      businessCaseId,
      videoUrl,
      textResponse,
    }: {
      applicationId: string;
      businessCaseId: string;
      videoUrl?: string;
      textResponse?: string;
    }) => {
      const { data, error } = await supabase
        .from('business_case_responses')
        .upsert({
          application_id: applicationId,
          business_case_id: businessCaseId,
          video_url: videoUrl,
          text_response: textResponse,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'application_id,business_case_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-case-responses', variables.applicationId] });
    },
  });
}

export function useCompleteBusinessCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('applications')
        .update({
          business_case_completed: true,
          business_case_completed_at: new Date().toISOString(),
          status: 'under_review',
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
  });
}
