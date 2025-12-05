import { InterviewQuestionsSection } from '@/components/recruiter/InterviewQuestionsSection';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';

interface InterviewTabProps {
  applicationId: string;
  jobId: string;
  interviews: any[];
  interviewsLoading: boolean;
}

export function InterviewTab({ applicationId, jobId, interviews, interviewsLoading }: InterviewTabProps) {
  return (
    <div className="space-y-4">
      <InterviewQuestionsSection applicationId={applicationId} jobId={jobId} />
      <InterviewScheduleCard interviews={interviews} isLoading={interviewsLoading} />
    </div>
  );
}
