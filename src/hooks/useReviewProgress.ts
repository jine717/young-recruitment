import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReviewProgress {
  id: string;
  application_id: string;
  recruiter_id: string;
  ai_analysis_reviewed: boolean;
  cv_analysis_reviewed: boolean;
  disc_analysis_reviewed: boolean;
  business_case_reviewed: boolean;
  ai_reviewed_by: string | null;
  ai_reviewed_at: string | null;
  cv_reviewed_by: string | null;
  cv_reviewed_at: string | null;
  disc_reviewed_by: string | null;
  disc_reviewed_at: string | null;
  business_case_reviewed_by: string | null;
  business_case_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ReviewSection = 'ai_analysis' | 'cv_analysis' | 'disc_analysis' | 'business_case';

// Shared review progress - same for all recruiters viewing the application
export function useReviewProgress(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['review-progress', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      // Get the shared review progress for this application (no recruiter_id filter)
      const { data, error } = await supabase
        .from('review_progress')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (error) throw error;
      return data as ReviewProgress | null;
    },
    enabled: !!applicationId,
  });
}

export function useCreateReviewProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check if already exists
      const { data: existing } = await supabase
        .from('review_progress')
        .select('id')
        .eq('application_id', applicationId)
        .eq('recruiter_id', userData.user.id)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from('review_progress')
        .insert({
          application_id: applicationId,
          recruiter_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReviewProgress;
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['review-progress', applicationId] });
    },
  });
}

export function useUpdateReviewSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      section, 
      reviewed 
    }: { 
      applicationId: string; 
      section: ReviewSection; 
      reviewed: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const columnName = `${section}_reviewed`;
      const reviewerColumn = `${section}_reviewed_by`;
      const reviewedAtColumn = `${section}_reviewed_at`;

      // Check if shared record exists for this application
      const { data: existing } = await supabase
        .from('review_progress')
        .select('id')
        .eq('application_id', applicationId)
        .maybeSingle();

      // If doesn't exist, create shared record
      if (!existing) {
        const { error: insertError } = await supabase
          .from('review_progress')
          .insert({
            application_id: applicationId,
            recruiter_id: userData.user.id, // Original creator
            [columnName]: reviewed,
            [reviewerColumn]: reviewed ? userData.user.id : null,
            [reviewedAtColumn]: reviewed ? new Date().toISOString() : null,
          });
        
        if (insertError) throw insertError;
        
        const { data: newRecord, error: fetchError } = await supabase
          .from('review_progress')
          .select('*')
          .eq('application_id', applicationId)
          .single();
          
        if (fetchError) throw fetchError;
        return newRecord as ReviewProgress;
      }

      // If exists, update shared record with auditor info
      const updateData: Record<string, unknown> = {
        [columnName]: reviewed,
        [reviewerColumn]: reviewed ? userData.user.id : null,
        [reviewedAtColumn]: reviewed ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('review_progress')
        .update(updateData)
        .eq('application_id', applicationId)
        .select()
        .single();

      if (error) throw error;
      return data as ReviewProgress;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review-progress', variables.applicationId] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update review status', {
        description: error.message,
      });
    },
  });
}

export function getReviewCompletionCount(progress: ReviewProgress | null): { completed: number; total: number } {
  if (!progress) return { completed: 0, total: 3 };
  
  let completed = 0;
  if (progress.ai_analysis_reviewed) completed++;
  if (progress.cv_analysis_reviewed) completed++;
  if (progress.disc_analysis_reviewed) completed++;
  
  return { completed, total: 3 };
}

export function isReviewComplete(progress: ReviewProgress | null): boolean {
  if (!progress) return false;
  return (
    progress.ai_analysis_reviewed &&
    progress.cv_analysis_reviewed &&
    progress.disc_analysis_reviewed
  );
}
