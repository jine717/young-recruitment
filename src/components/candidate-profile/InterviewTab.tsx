import { InterviewQuestionsCard } from '@/components/recruiter/InterviewQuestionsCard';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';

interface InterviewTabProps {
  applicationId: string;
  interviews: any[];
  interviewsLoading: boolean;
}

export function InterviewTab({ applicationId, interviews, interviewsLoading }: InterviewTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Left: Questions & Schedule */}
      <div className="space-y-4">
        <InterviewQuestionsCard applicationId={applicationId} />
        <InterviewScheduleCard interviews={interviews} isLoading={interviewsLoading} />
      </div>

      {/* Right: Reserved for future components */}
      {/* Hidden for now: InterviewEvaluationsCard, DecisionHistory */}
    </div>
  );
}
