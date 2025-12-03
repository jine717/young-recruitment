import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AITemplate {
  id: string;
  name: string;
  description: string | null;
  prompt_content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AITemplateInput {
  name: string;
  description?: string | null;
  prompt_content: string;
}

export function useAITemplates() {
  return useQuery({
    queryKey: ['ai-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_evaluation_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as AITemplate[];
    },
  });
}

export function useCreateAITemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AITemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ai_evaluation_templates')
        .insert({
          name: input.name,
          description: input.description || null,
          prompt_content: input.prompt_content,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
      toast.success('Template saved successfully');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Failed to save template');
    },
  });
}

export function useUpdateAITemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: AITemplateInput & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_evaluation_templates')
        .update({
          name: input.name,
          description: input.description || null,
          prompt_content: input.prompt_content,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    },
  });
}

export function useDeleteAITemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_evaluation_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
      toast.success('Template deleted');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    },
  });
}
