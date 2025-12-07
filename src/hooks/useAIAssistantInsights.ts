import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIAssistantInsights {
  totalApplications: number;
  pendingReview: number;
  scheduledInterviews: number;
  topCandidates: Array<{
    id: string;
    name: string;
    score: number;
    jobTitle: string;
  }>;
  recentApplications: number;
  suggestedQuestions: string[];
}

export function useAIAssistantInsights() {
  return useQuery({
    queryKey: ['ai-assistant-insights'],
    queryFn: async () => {
      // Fetch applications with jobs
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          candidate_name,
          ai_score,
          status,
          created_at,
          jobs (title)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (appError) throw appError;

      // Fetch upcoming interviews
      const { data: interviews, error: intError } = await supabase
        .from('interviews')
        .select('id, application_id, interview_date, status')
        .eq('status', 'scheduled')
        .gte('interview_date', new Date().toISOString())
        .order('interview_date', { ascending: true })
        .limit(10);

      if (intError) throw intError;

      // Calculate insights
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalApplications = applications?.length || 0;
      const pendingReview = applications?.filter(a => a.status === 'pending' || a.status === 'under_review').length || 0;
      const scheduledInterviews = interviews?.length || 0;
      const recentApplications = applications?.filter(a => new Date(a.created_at) >= weekAgo).length || 0;

      // Top candidates by AI score
      const topCandidates = applications
        ?.filter(a => a.ai_score && a.ai_score >= 70 && a.candidate_name)
        .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          name: a.candidate_name || 'Unknown',
          score: a.ai_score || 0,
          jobTitle: a.jobs?.title || 'Unknown Position',
        })) || [];

      // Generate dynamic suggested questions based on data
      const suggestedQuestions: string[] = [];

      if (pendingReview > 0) {
        suggestedQuestions.push(`Review the ${pendingReview} candidates awaiting evaluation`);
      }

      if (topCandidates.length > 0) {
        suggestedQuestions.push(`Tell me about ${topCandidates[0].name}'s qualifications`);
      }

      if (scheduledInterviews > 0) {
        suggestedQuestions.push(`What interviews are scheduled this week?`);
      }

      if (recentApplications > 0) {
        suggestedQuestions.push(`Summarize the ${recentApplications} applications from this week`);
      }

      // Add fallback questions
      const fallbackQuestions = [
        "Who are the top candidates with highest AI scores?",
        "What's the current pipeline status?",
        "Which candidates should I prioritize interviewing?",
        "Compare interview conversion rates across jobs",
      ];

      // Fill with fallback questions if needed
      while (suggestedQuestions.length < 5 && fallbackQuestions.length > 0) {
        const q = fallbackQuestions.shift();
        if (q && !suggestedQuestions.includes(q)) {
          suggestedQuestions.push(q);
        }
      }

      return {
        totalApplications,
        pendingReview,
        scheduledInterviews,
        topCandidates,
        recentApplications,
        suggestedQuestions: suggestedQuestions.slice(0, 5),
      } as AIAssistantInsights;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
}
