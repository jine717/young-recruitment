import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export function useAllJobs() {
  return useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, departments (name)`)
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
      const { data, error } = await supabase
        .from('jobs')
        .insert(job)
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
