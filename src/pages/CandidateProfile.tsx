import { useState, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useUpdateApplicationStatus, useDeleteApplication } from '@/hooks/useApplications';
import { useAIEvaluation, useTriggerAIAnalysis } from '@/hooks/useAIEvaluations';
import { useSendNotification, type NotificationType } from '@/hooks/useNotifications';
import { useInterviews } from '@/hooks/useInterviews';
import { useDocumentAnalyses } from '@/hooks/useDocumentAnalysis';
import { CandidateHeader } from '@/components/candidate-profile/CandidateHeader';
import { OverviewTab } from '@/components/candidate-profile/OverviewTab';
import { DocumentsTab } from '@/components/candidate-profile/DocumentsTab';
import { InterviewTab } from '@/components/candidate-profile/InterviewTab';
import { ScheduleInterviewModal } from '@/components/candidate-profile/ScheduleInterviewModal';
import { CandidateAIAssistant } from '@/components/candidate-profile/CandidateAIAssistant';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Briefcase, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CandidateContext } from '@/hooks/useAIAssistant';

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRoleCheck(['recruiter', 'admin']);
  const { toast } = useToast();
  const updateStatus = useUpdateApplicationStatus();
  const deleteApplication = useDeleteApplication();
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
  const { data: documentAnalyses } = useDocumentAnalyses(applicationId);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Build candidate context for AI Assistant
  const candidateContext: CandidateContext | null = useMemo(() => {
    if (!application) return null;
    
    const cvAnalysis = documentAnalyses?.find(d => d.document_type === 'cv');
    const discAnalysis = documentAnalyses?.find(d => d.document_type === 'disc');
    
    return {
      id: application.id,
      name: application.candidate_name || application.profile.full_name || 'Unknown',
      email: application.candidate_email || application.profile.email || undefined,
      jobTitle: application.job.title,
      jobId: application.job_id,
      aiScore: aiEvaluation?.overall_score ?? null,
      recommendation: aiEvaluation?.recommendation ?? null,
      status: application.status,
      cvSummary: cvAnalysis?.summary || undefined,
      discProfile: (discAnalysis?.analysis as any)?.profile_type || undefined,
      strengths: aiEvaluation?.strengths || undefined,
      concerns: aiEvaluation?.concerns || undefined,
    };
  }, [application, aiEvaluation, documentAnalyses]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteApplication(application.id);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Candidate deleted successfully' });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error deleting candidate',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar user={user} isAdmin={isAdmin} showDashboardLink />

      <div className="max-w-7xl mx-auto p-6 pt-24 space-y-6">
        {/* Header with AI Score and Quick Actions */}
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
          aiScore={aiEvaluation?.overall_score ?? null}
          aiRecommendation={aiEvaluation?.recommendation ?? null}
          aiLoading={aiLoading}
          initialScore={aiEvaluation?.initial_overall_score ?? null}
          evaluationStage={aiEvaluation?.evaluation_stage ?? null}
          applicationId={application.id}
          onScheduleInterview={() => setShowScheduleModal(true)}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />

        {/* Schedule Interview Modal */}
        <ScheduleInterviewModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          applicationId={application.id}
          candidateName={application.candidate_name || application.profile.full_name || 'Candidate'}
          jobTitle={application.job.title}
        />

        {/* Full-width Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="overview" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Overview
              {application.ai_evaluation_status === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--young-gold))] animate-pulse" />
              )}
              {aiEvaluation && (
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--young-blue))]" />
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Documents
              {(application.cv_url || application.disc_url) && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {[application.cv_url, application.disc_url].filter(Boolean).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-2">
              <Users className="w-4 h-4" />
              Interview
              {interviews.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))]">
                  {interviews.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <OverviewTab
              applicationId={application.id}
              jobId={application.job_id}
              aiEvaluation={aiEvaluation}
              aiLoading={aiLoading}
              onTriggerAI={handleTriggerAI}
              isTriggering={triggerAI.isPending}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <DocumentsTab
              applicationId={application.id}
              cvUrl={application.cv_url}
              discUrl={application.disc_url}
            />
          </TabsContent>

          <TabsContent value="interview" className="mt-0">
            <InterviewTab
              applicationId={application.id}
              jobId={application.job_id}
              interviews={interviews}
              interviewsLoading={interviewsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Context-Aware AI Assistant */}
      {candidateContext && <CandidateAIAssistant candidateContext={candidateContext} />}
    </div>
  );
}
