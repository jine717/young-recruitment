import { InterviewQuestionsSection } from '@/components/recruiter/InterviewQuestionsSection';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';
import { InterviewAnalysisCard } from '@/components/candidate-profile/InterviewAnalysisCard';

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
      <InterviewAnalysisCard applicationId={applicationId} />
      <InterviewScheduleCard interviews={interviews} isLoading={interviewsLoading} />
    </div>
  );
}
