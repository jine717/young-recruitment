import { InterviewQuestionsCard } from '@/components/recruiter/InterviewQuestionsCard';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';

interface InterviewTabProps {
  applicationId: string;
  interviews: any[];
  interviewsLoading: boolean;
}

export function InterviewTab({ applicationId, interviews, interviewsLoading }: InterviewTabProps) {
  return (
    <div className="space-y-4">
      <InterviewQuestionsCard applicationId={applicationId} />
      <InterviewScheduleCard interviews={interviews} isLoading={interviewsLoading} />
    </div>
  );
}
