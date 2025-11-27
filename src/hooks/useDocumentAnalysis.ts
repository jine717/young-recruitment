import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CVAnalysis {
  candidate_summary: string;
  experience_years: number;
  key_skills: string[];
  education: { degree: string; institution: string; year?: string }[];
  work_history: { company: string; role: string; duration: string }[];
  strengths: string[];
  red_flags: string[];
  overall_impression: string;
}

export interface DISCAnalysis {
  profile_type: 'D' | 'I' | 'S' | 'C';
  profile_description: string;
  dominant_traits: string[];
  communication_style: string;
  work_style: string;
  strengths: string[];
  potential_challenges: string[];
  management_tips: string;
  team_fit_considerations: string;
}

export interface DocumentAnalysis {
  id: string;
  application_id: string;
  document_type: 'cv' | 'disc';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis: CVAnalysis | DISCAnalysis | null;
  summary: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocumentAnalyses(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['document-analyses', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('application_id', applicationId);

      if (error) throw error;
      return (data || []) as unknown as DocumentAnalysis[];
    },
    enabled: !!applicationId,
  });
}

export function useTriggerDocumentAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      documentType, 
      documentPath 
    }: { 
      applicationId: string; 
      documentType: 'cv' | 'disc'; 
      documentPath: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { applicationId, documentType, documentPath },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-analyses', variables.applicationId] });
    },
  });
}
