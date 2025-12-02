import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useUpdateApplicationStatus } from '@/hooks/useApplications';
import { useAIEvaluation, useTriggerAIAnalysis } from '@/hooks/useAIEvaluations';
import { useSendNotification, type NotificationType } from '@/hooks/useNotifications';
import { useInterviews } from '@/hooks/useInterviews';
import { CandidateHeader } from '@/components/candidate-profile/CandidateHeader';
import { DocumentsSection } from '@/components/candidate-profile/DocumentsSection';
import { BusinessCaseViewer } from '@/components/candidate-profile/BusinessCaseViewer';
import { RecruiterNotes } from '@/components/candidate-profile/RecruiterNotes';
import { NotificationHistory } from '@/components/candidate-profile/NotificationHistory';
import { InterviewEvaluationForm } from '@/components/candidate-profile/InterviewEvaluationForm';
import { InterviewEvaluationsCard } from '@/components/candidate-profile/InterviewEvaluationCard';
import { HiringDecisionModal } from '@/components/candidate-profile/HiringDecisionModal';
import { DecisionHistory } from '@/components/candidate-profile/DecisionHistory';
import { ScheduleInterviewModal } from '@/components/candidate-profile/ScheduleInterviewModal';
import { InterviewScheduleCard } from '@/components/candidate-profile/InterviewScheduleCard';
import { AIEvaluationCard } from '@/components/recruiter/AIEvaluationCard';
import { InterviewQuestionsCard } from '@/components/recruiter/InterviewQuestionsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { Brain, Loader2, CalendarPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApplicationDetail {
  id: string;
  candidate_id: string | null;
  candidate_name: string | null;
  candidate_email: string | null;
  job_id: string;
  status: string;
  cv_url: string | null;
  disc_url: string | null;
  business_case_completed: boolean;
  ai_evaluation_status: string | null;
  created_at: string;
  job: {
    id: string;
    title: string;
    department: {
      name: string;
    } | null;
  };
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export default function CandidateProfile() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRoleCheck(['recruiter', 'admin']);
  const { toast } = useToast();
  const updateStatus = useUpdateApplicationStatus();
  const triggerAI = useTriggerAIAnalysis();
  const sendNotification = useSendNotification();

  const { data: application, isLoading } = useQuery({
    queryKey: ['application-detail', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;

      const { data: app, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs (
            id,
            title,
            department:departments (name)
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      // Get profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', app.candidate_id)
        .single();

      return {
        ...app,
        profile: profile || { full_name: null, email: null, phone: null },
      } as ApplicationDetail;
    },
    enabled: !!applicationId && !!user,
  });

  const { data: aiEvaluation, isLoading: aiLoading } = useAIEvaluation(applicationId);
  const { data: interviews = [], isLoading: interviewsLoading } = useInterviews(applicationId);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Application not found.</p>
      </div>
    );
  }

  const getNotificationTypeForStatus = (status: string): NotificationType | null => {
    switch (status) {
      case 'interview':
        return 'interview_scheduled';
      case 'hired':
        return 'decision_offer';
      case 'rejected':
        return 'decision_rejection';
      case 'under_review':
        return 'status_update';
      default:
        return null;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatus(application.id, newStatus as any);

      const notificationType = getNotificationTypeForStatus(newStatus);
      if (notificationType) {
        sendNotification.mutate({
          applicationId: application.id,
          type: notificationType,
        });
      }

      toast({ title: 'Status updated successfully' });
    } catch (error) {
      toast({
        title: 'Error updating status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTriggerAI = async () => {
    try {
      await triggerAI.mutateAsync(application.id);
      toast({ title: 'AI analysis started' });
    } catch (error) {
      toast({
        title: 'Error starting AI analysis',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar user={user} isAdmin={isAdmin} showDashboardLink />

      <div className="max-w-7xl mx-auto p-6 pt-24 space-y-6">
        {/* Header */}
        <CandidateHeader
          candidateName={application.candidate_name || application.profile.full_name || 'Unknown Candidate'}
          email={application.candidate_email || application.profile.email || 'No email'}
          phone={application.profile.phone}
          jobTitle={application.job.title}
          departmentName={application.job.department?.name || null}
          applicationDate={application.created_at}
          status={application.status}
          onStatusChange={handleStatusChange}
          isUpdating={isUpdatingStatus}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowScheduleModal(true)}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
          <InterviewEvaluationForm applicationId={application.id} />
          <HiringDecisionModal applicationId={application.id} />
        </div>

        {/* Schedule Interview Modal */}
        <ScheduleInterviewModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          applicationId={application.id}
          candidateName={application.candidate_name || application.profile.full_name || 'Candidate'}
          jobTitle={application.job.title}
        />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Documents & Business Case */}
          <div className="lg:col-span-2 space-y-6">
            <DocumentsSection
              applicationId={application.id}
              cvUrl={application.cv_url}
              discUrl={application.disc_url}
            />

            <BusinessCaseViewer
              applicationId={application.id}
              jobId={application.job_id}
            />
          </div>

          {/* Right Column - AI & Notes */}
          <div className="space-y-6">
            {/* AI Evaluation */}
            {aiLoading ? (
              <Skeleton className="h-64" />
            ) : aiEvaluation ? (
              <AIEvaluationCard evaluation={aiEvaluation} />
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center space-y-3">
                <Brain className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No AI evaluation yet
                </p>
                <Button
                  onClick={handleTriggerAI}
                  disabled={triggerAI.isPending}
                  size="sm"
                >
                  {triggerAI.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Run AI Analysis
                </Button>
              </div>
            )}

            {/* Scheduled Interviews */}
            <InterviewScheduleCard 
              interviews={interviews} 
              isLoading={interviewsLoading} 
            />

            {/* Interview Evaluations */}
            <InterviewEvaluationsCard applicationId={application.id} />

            {/* Interview Questions */}
            <InterviewQuestionsCard applicationId={application.id} />

            {/* Decision History */}
            <DecisionHistory applicationId={application.id} />

            {/* Recruiter Notes */}
            <RecruiterNotes applicationId={application.id} />

            {/* Notification History */}
            <NotificationHistory applicationId={application.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
