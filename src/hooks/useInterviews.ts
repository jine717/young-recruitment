import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type InterviewType = 'phone' | 'video' | 'in_person';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface Interview {
  id: string;
  application_id: string;
  scheduled_by: string;
  interview_date: string;
  duration_minutes: number;
  interview_type: InterviewType;
  location: string | null;
  meeting_link: string | null;
  notes_for_candidate: string | null;
  internal_notes: string | null;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewData {
  application_id: string;
  interview_date: string;
  duration_minutes: number;
  interview_type: InterviewType;
  location?: string;
  meeting_link?: string;
  notes_for_candidate?: string;
  internal_notes?: string;
}

export interface UpdateInterviewData {
  id: string;
  interview_date?: string;
  duration_minutes?: number;
  interview_type?: InterviewType;
  location?: string;
  meeting_link?: string;
  notes_for_candidate?: string;
  internal_notes?: string;
  status?: InterviewStatus;
}

export function useInterviews(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['interviews', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', applicationId)
        .order('interview_date', { ascending: true });

      if (error) throw error;
      return data as Interview[];
    },
    enabled: !!applicationId,
  });
}

export function useScheduleInterview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInterviewData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: interview, error } = await supabase
        .from('interviews')
        .insert({
          ...data,
          scheduled_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-transition: reviewed → interview when scheduling
      // First check current application status
      const { data: application } = await supabase
        .from('applications')
        .select('status')
        .eq('id', data.application_id)
        .single();

      if (application && application.status === 'reviewed') {
        await supabase
          .from('applications')
          .update({ status: 'interview' })
          .eq('id', data.application_id);
      }

      return interview as Interview;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Interview Scheduled",
        description: "The interview has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['interviews', variables.application_id] });
      queryClient.invalidateQueries({ queryKey: ['application-detail', variables.application_id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInterview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateInterviewData) => {
      const { data: interview, error } = await supabase
        .from('interviews')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return interview as Interview;
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Updated",
        description: "The interview has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.application_id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelInterview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: interview, error } = await supabase
        .from('interviews')
        .update({ status: 'cancelled' as InterviewStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return interview as Interview;
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Cancelled",
        description: "The interview has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.application_id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Helper function to generate .ics calendar file
export function generateICSFile(interview: Interview, jobTitle: string, candidateName: string): string {
  const startDate = new Date(interview.interview_date);
  const endDate = new Date(startDate.getTime() + interview.duration_minutes * 60000);

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const typeLabels: Record<InterviewType, string> = {
    phone: 'Phone',
    video: 'Video',
    in_person: 'In-Person',
  };

  const location = interview.meeting_link || interview.location || 'TBD';
  const description = interview.notes_for_candidate || `Interview for ${jobTitle} position`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Young Recruitment//Interview//EN
BEGIN:VEVENT
UID:${interview.id}@young-recruitment
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${typeLabels[interview.interview_type]} Interview - ${jobTitle}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

export function downloadICSFile(interview: Interview, jobTitle: string, candidateName: string) {
  const icsContent = generateICSFile(interview, jobTitle, candidateName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `interview-${jobTitle.toLowerCase().replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
