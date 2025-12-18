import { useState } from 'react';
import { InterviewQuestionsSection } from '@/components/recruiter/InterviewQuestionsSection';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';
import { InterviewAnalysisCard } from '@/components/candidate-profile/InterviewAnalysisCard';
import { InterviewProgressTracker } from '@/components/candidate-profile/InterviewProgressTracker';
import { useUpdateInterview } from '@/hooks/useInterviews';
import { toast } from 'sonner';

interface InterviewTabProps {
  applicationId: string;
  jobId: string;
  interviews: any[];
  interviewsLoading: boolean;
  applicationStatus: string;
  canEdit: boolean;
  onScheduleInterview?: () => void;
  candidateName?: string;
  jobTitle?: string;
}

export function InterviewTab({ 
  applicationId, 
  jobId, 
  interviews, 
  interviewsLoading,
  applicationStatus,
  canEdit,
  onScheduleInterview,
  candidateName,
  jobTitle,
}: InterviewTabProps) {
  const [interviewConducted, setInterviewConducted] = useState(false);
  const updateInterview = useUpdateInterview();

  const hasScheduledInterview = interviews.some(i => i.status === 'scheduled' || i.status === 'rescheduled');
  const hasCompletedInterview = interviews.some(i => i.status === 'completed');

  const handleMarkComplete = async () => {
    const scheduledInterview = interviews.find(i => i.status === 'scheduled' || i.status === 'rescheduled');
    if (!scheduledInterview) return;

    try {
      await updateInterview.mutateAsync({
        id: scheduledInterview.id,
        status: 'completed',
      });
      toast.success('Interview marked as completed');
      setInterviewConducted(false);
    } catch (error) {
      toast.error('Failed to mark interview as complete');
    }
  };

  return (
    <div className="space-y-4">
      <InterviewProgressTracker
        hasScheduledInterview={hasScheduledInterview}
        hasCompletedInterview={hasCompletedInterview}
        interviewConducted={interviewConducted}
        onInterviewConductedChange={setInterviewConducted}
        onMarkComplete={handleMarkComplete}
        isMarkingComplete={updateInterview.isPending}
        canEdit={canEdit}
        applicationStatus={applicationStatus}
      />
      <InterviewQuestionsSection applicationId={applicationId} jobId={jobId} />
      <InterviewAnalysisCard applicationId={applicationId} />
      <InterviewScheduleCard 
        interviews={interviews} 
        isLoading={interviewsLoading} 
        onScheduleInterview={onScheduleInterview}
        canEdit={canEdit}
        applicationId={applicationId}
        candidateName={candidateName}
        jobTitle={jobTitle}
        applicationStatus={applicationStatus}
      />
    </div>
  );
}
