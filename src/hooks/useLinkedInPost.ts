import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LinkedInPostState {
  content: string;
  characterCount: number;
  hashtags: string[];
  cached: boolean;
  isGenerated: boolean;
}

interface GeneratePostParams {
  jobId: string;
  regenerate?: boolean;
  customInstructions?: string;
}

export function useLinkedInPost() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<LinkedInPostState>({
    content: '',
    characterCount: 0,
    hashtags: [],
    cached: false,
    isGenerated: false,
  });

  const generateMutation = useMutation({
    mutationFn: async ({ jobId, regenerate, customInstructions }: GeneratePostParams) => {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: { jobId, regenerate, customInstructions },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate post');
      
      return data;
    },
    onSuccess: (data) => {
      setState({
        content: data.content,
        characterCount: data.characterCount,
        hashtags: data.hashtags || [],
        cached: data.cached,
        isGenerated: true,
      });
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to generate LinkedIn post';
      if (message.includes('429') || message.includes('rate limit')) {
        toast({
          title: 'Rate limit exceeded',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive',
        });
      } else if (message.includes('402') || message.includes('credits')) {
        toast({
          title: 'AI credits exhausted',
          description: 'Please add credits to continue using AI features.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Generation failed',
          description: message,
          variant: 'destructive',
        });
      }
    },
  });

  const markAsPostedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({
          linkedin_post_status: 'posted',
          linkedin_posted_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      toast({
        title: 'Marked as posted',
        description: 'LinkedIn post status updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Could not update post status.',
        variant: 'destructive',
      });
    },
  });

  const generatePost = useCallback((params: GeneratePostParams) => {
    generateMutation.mutate(params);
  }, [generateMutation]);

  const copyToClipboard = useCallback(async () => {
    if (!state.content) return false;
    
    try {
      await navigator.clipboard.writeText(state.content);
      toast({
        title: 'Copied!',
        description: 'Post content copied to clipboard.',
      });
      return true;
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.content]);

  const openLinkedIn = useCallback(() => {
    const linkedInShareUrl = 'https://www.linkedin.com/sharing/share-offsite/';
    window.open(linkedInShareUrl, '_blank', 'width=600,height=600');
  }, []);

  const markAsPosted = useCallback((jobId: string) => {
    markAsPostedMutation.mutate(jobId);
  }, [markAsPostedMutation]);

  const updateContent = useCallback((newContent: string) => {
    setState(prev => ({
      ...prev,
      content: newContent,
      characterCount: newContent.length,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      content: '',
      characterCount: 0,
      hashtags: [],
      cached: false,
      isGenerated: false,
    });
  }, []);

  return {
    ...state,
    isLoading: generateMutation.isPending,
    isMarkingPosted: markAsPostedMutation.isPending,
    error: generateMutation.error,
    generatePost,
    copyToClipboard,
    openLinkedIn,
    markAsPosted,
    updateContent,
    reset,
  };
}
