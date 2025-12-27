import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface JobInput {
  title: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  department_id: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  tags: string[];
  status: 'draft' | 'published' | 'closed';
  ai_system_prompt?: string | null;
  ai_interview_prompt?: string | null;
  linkedin_post_status?: 'not_posted' | 'draft' | 'posted';
  linkedin_posted_at?: string | null;
  linkedin_post_content?: string | null;
  linkedin_posted_by?: string | null;
}

export function useAllJobs() {
  return useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *, 
          departments (name),
          creator:profiles!created_by (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (job: JobInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...job, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...job }: JobInput & { id: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(job)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
      toast({ title: 'Job updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('delete-job-cascade', {
        body: { jobId: id },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      const stats = data.stats;
      const totalFiles = stats.files.cvs + stats.files.discs + stats.files.videos;
      toast({ 
        title: 'Vacante eliminada',
        description: `Se eliminaron ${stats.records.applications} candidatos y ${totalFiles} archivos.`
      });
    },
    onError: (error) => {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDuplicateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (jobId: string) => {
      // 1. Fetch the original job
      const { data: originalJob, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Create duplicate job
      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: `${originalJob.title} - Copia`,
          location: originalJob.location,
          type: originalJob.type,
          department_id: originalJob.department_id,
          description: originalJob.description,
          responsibilities: originalJob.responsibilities,
          requirements: originalJob.requirements,
          benefits: originalJob.benefits,
          tags: originalJob.tags,
          ai_system_prompt: originalJob.ai_system_prompt,
          ai_interview_prompt: originalJob.ai_interview_prompt,
          status: 'draft',
          created_by: user?.id,
          linkedin_post_status: 'not_posted',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Duplicate business cases
      const { data: businessCases } = await supabase
        .from('business_cases')
        .select('*')
        .eq('job_id', jobId)
        .order('question_number', { ascending: true });

      if (businessCases && businessCases.length > 0) {
        const duplicatedBCs = businessCases.map(bc => ({
          job_id: newJob.id,
          question_number: bc.question_number,
          question_title: bc.question_title,
          question_description: bc.question_description,
          video_url: bc.video_url,
          has_text_response: bc.has_text_response,
        }));

        await supabase.from('business_cases').insert(duplicatedBCs);
      }

      // 5. Duplicate fixed interview questions
      const { data: fixedQuestions } = await supabase
        .from('job_fixed_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('question_order', { ascending: true });

      if (fixedQuestions && fixedQuestions.length > 0) {
        const duplicatedFQs = fixedQuestions.map(fq => ({
          job_id: newJob.id,
          question_text: fq.question_text,
          category: fq.category,
          priority: fq.priority,
          question_order: fq.question_order,
        }));

        await supabase.from('job_fixed_questions').insert(duplicatedFQs);
      }

      return newJob;
    },
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ 
        title: 'Job duplicado exitosamente',
        description: 'Se ha creado una copia incluyendo BCQ y preguntas fijas. Redirigiendo...'
      });
      navigate(`/dashboard/jobs/${newJob.id}/edit`);
    },
    onError: (error) => {
      toast({ 
        title: 'Error al duplicar', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
