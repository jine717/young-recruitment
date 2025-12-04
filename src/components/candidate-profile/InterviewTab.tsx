import { InterviewQuestionsCard } from '@/components/recruiter/InterviewQuestionsCard';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';
import { InterviewEvaluationsCard } from '@/components/candidate-profile/InterviewEvaluationCard';
import { DecisionHistory } from '@/components/candidate-profile/DecisionHistory';

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

      {/* Right: Evaluations & Decisions */}
      <div className="space-y-4">
        <InterviewEvaluationsCard applicationId={applicationId} />
        <DecisionHistory applicationId={applicationId} />
      </div>
    </div>
  );
}
