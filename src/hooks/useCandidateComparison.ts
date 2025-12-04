import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CandidateRanking {
  rank: number;
  candidate_name: string;
  application_id: string;
  score: number;
  key_differentiator: string;
}

export interface ComparisonMatrixItem {
  criterion: string;
  candidates: {
    application_id: string;
    score: number;
    notes: string;
  }[];
}

export interface ComparisonRecommendation {
  top_choice: string;
  application_id: string;
  confidence: 'high' | 'medium' | 'low';
  justification: string;
  alternative?: string;
  alternative_justification?: string;
}

export interface CandidateRisk {
  candidate_name: string;
  application_id: string;
  risks: string[];
}

export interface BusinessCaseResponseAnalysis {
  application_id: string;
  candidate_name: string;
  response_summary: string;
  score: number;
  assessment: string;
}

export interface BusinessCaseAnalysisItem {
  question_title: string;
  question_description?: string;
  candidate_responses: BusinessCaseResponseAnalysis[];
  comparative_analysis: string;
  best_response: string;
}

export interface ComparisonResult {
  executive_summary: string;
  rankings: CandidateRanking[];
  comparison_matrix: ComparisonMatrixItem[];
  recommendation: ComparisonRecommendation;
  risks: CandidateRisk[];
  business_case_analysis?: BusinessCaseAnalysisItem[];
}

export interface JobWithApplicationCount {
  id: string;
  title: string;
  location: string;
  applicationCount: number;
}

export function useJobsWithApplications() {
  return useQuery({
    queryKey: ['jobs-with-applications'],
    queryFn: async () => {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, location')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const jobsWithCounts: JobWithApplicationCount[] = [];

      for (const job of jobs || []) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);

        if ((count || 0) >= 2) {
          jobsWithCounts.push({
            ...job,
            applicationCount: count || 0,
          });
        }
      }

      return jobsWithCounts;
    },
  });
}

export function useJobCandidates(jobId: string | null) {
  return useQuery({
    queryKey: ['job-candidates', jobId],
    queryFn: async () => {
      if (!jobId) return [];

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          candidate_name,
          candidate_email,
          ai_score,
          status,
          ai_evaluations (
            overall_score,
            recommendation
          )
        `)
        .eq('job_id', jobId)
        .order('ai_score', { ascending: false, nullsFirst: false });

      if (error) throw error;

      return data.map(app => ({
        id: app.id,
        candidate_name: app.candidate_name,
        candidate_email: app.candidate_email,
        ai_score: app.ai_score,
        status: app.status,
        ai_recommendation: app.ai_evaluations?.[0]?.recommendation || null,
      }));
    },
    enabled: !!jobId,
  });
}

export interface SavedComparison {
  id: string;
  job_id: string;
  application_ids: string[];
  evaluation_prompt: string | null;
  comparison_result: ComparisonResult;
  status: string;
  created_by: string;
  created_at: string;
}

export function useComparisonHistory(jobId: string | null) {
  return useQuery({
    queryKey: ['comparison-history', jobId],
    queryFn: async () => {
      if (!jobId) return [];

      const { data, error } = await supabase
        .from('candidate_comparisons')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        comparison_result: item.comparison_result as unknown as ComparisonResult,
      })) as SavedComparison[];
    },
    enabled: !!jobId,
  });
}

export function useDeleteComparison() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comparisonId: string) => {
      const { error } = await supabase
        .from('candidate_comparisons')
        .delete()
        .eq('id', comparisonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-history'] });
      toast({
        title: 'Comparison Deleted',
        description: 'The comparison has been removed from history.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCompareCandidates() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isComparing, setIsComparing] = useState(false);

  const compareMutation = useMutation({
    mutationFn: async ({ 
      applicationIds, 
      customPrompt, 
      jobId 
    }: { 
      applicationIds: string[]; 
      customPrompt: string; 
      jobId: string;
    }) => {
      setIsComparing(true);

      const { data, error } = await supabase.functions.invoke('compare-candidates', {
        body: { applicationIds, customPrompt, jobId, createdBy: user?.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as {
        success: boolean;
        comparison: ComparisonResult;
        comparisonId: string | null;
        candidates: { application_id: string; candidate_name: string }[];
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comparison-history', variables.jobId] });
      toast({
        title: 'Comparison Complete',
        description: 'AI has analyzed and compared the selected candidates.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Comparison Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsComparing(false);
    },
  });

  return {
    compare: compareMutation.mutate,
    isComparing: isComparing || compareMutation.isPending,
    result: compareMutation.data,
    error: compareMutation.error,
    reset: compareMutation.reset,
  };
}
