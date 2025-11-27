import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Job {
  id: string;
  title: string;
  department_id: string | null;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  tags: string[];
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
  departments?: {
    name: string;
  } | null;
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          departments (name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          departments (name)
        `)
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      return data as Job | null;
    },
    enabled: !!id,
  });
}
