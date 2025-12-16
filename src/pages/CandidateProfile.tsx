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
import { useBusinessCases, useBusinessCaseResponses } from '@/hooks/useBusinessCase';
import { useInterviewQuestions } from '@/hooks/useInterviewQuestions';
import { useJobFixedQuestions } from '@/hooks/useJobFixedQuestions';
import { useFixedQuestionNotes } from '@/hooks/useFixedQuestionNotes';
import { useRecruiterNotes } from '@/hooks/useRecruiterNotes';
import { useInterviewEvaluations } from '@/hooks/useInterviewEvaluations';
import { useHiringDecisions } from '@/hooks/useHiringDecisions';
import { CandidateHeader } from '@/components/candidate-profile/CandidateHeader';
import { OverviewTab } from '@/components/candidate-profile/OverviewTab';
import { InterviewTab } from '@/components/candidate-profile/InterviewTab';
import { ScheduleInterviewModal } from '@/components/candidate-profile/ScheduleInterviewModal';
import { CandidateAIAssistant } from '@/components/candidate-profile/CandidateAIAssistant';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users } from 'lucide-react';
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
  const { isAdmin, canEdit } = useRoleCheck(['recruiter', 'admin', 'management']);
  const { toast } = useToast();
  const updateStatus = useUpdateApplicationStatus();
  const deleteApplication = useDeleteApplication();
  const triggerAI = useTriggerAIAnalysis();
  const sendNotification = useSendNotification();

  // Core application data
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

  // AI Evaluation
  const { data: aiEvaluation, isLoading: aiLoading } = useAIEvaluation(applicationId);
  
  // Interviews
  const { data: interviews = [], isLoading: interviewsLoading } = useInterviews(applicationId);
  
  // Document Analyses (CV and DISC)
  const { data: documentAnalyses } = useDocumentAnalyses(applicationId);
  
  // Business Cases and Responses
  const { data: businessCases = [] } = useBusinessCases(application?.job_id);
  const { data: businessCaseResponses = [] } = useBusinessCaseResponses(applicationId);
  
  // Interview Questions (AI-generated)
  const { data: interviewQuestions = [] } = useInterviewQuestions(applicationId);
  
  // Fixed Interview Questions
  const { data: fixedQuestions = [] } = useJobFixedQuestions(application?.job_id);
  const { data: fixedQuestionNotes = [] } = useFixedQuestionNotes(applicationId);
  
  // Recruiter Notes
  const { data: recruiterNotes = [] } = useRecruiterNotes(applicationId);
  
  // Interview Evaluations
  const { data: interviewEvaluations = [] } = useInterviewEvaluations(applicationId);
  
  // Hiring Decisions
  const { data: hiringDecisions = [] } = useHiringDecisions(applicationId);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Build comprehensive candidate context for AI Assistant
  const candidateContext: CandidateContext | null = useMemo(() => {
    if (!application) return null;
    
    const cvAnalysisDoc = documentAnalyses?.find(d => d.document_type === 'cv');
    const discAnalysisDoc = documentAnalyses?.find(d => d.document_type === 'disc');
    // Interview analysis is stored with document_type as string, cast to check
    const interviewAnalysisDoc = documentAnalyses?.find(d => (d.document_type as string) === 'interview');
    
    // Parse CV analysis
    const cvAnalysisData = cvAnalysisDoc?.analysis as any;
    const cvAnalysis = cvAnalysisDoc?.status === 'completed' ? {
      summary: cvAnalysisDoc.summary || undefined,
      experienceYears: cvAnalysisData?.experience_years || cvAnalysisData?.years_of_experience,
      keySkills: cvAnalysisData?.skills || cvAnalysisData?.key_skills,
      education: cvAnalysisData?.education,
      workHistory: cvAnalysisData?.work_history || cvAnalysisData?.experience,
      strengths: cvAnalysisData?.strengths,
      redFlags: cvAnalysisData?.red_flags || cvAnalysisData?.concerns,
      overallImpression: cvAnalysisData?.overall_impression,
    } : undefined;
    
    // Parse DISC analysis
    const discAnalysisData = discAnalysisDoc?.analysis as any;
    const discAnalysis = discAnalysisDoc?.status === 'completed' ? {
      profileType: discAnalysisData?.profile_type,
      profileDescription: discAnalysisData?.profile_description,
      dominantTraits: discAnalysisData?.dominant_traits,
      communicationStyle: discAnalysisData?.communication_style,
      workStyle: discAnalysisData?.work_style,
      managementTips: discAnalysisData?.management_tips,
      potentialChallenges: discAnalysisData?.potential_challenges,
      teamFitConsiderations: discAnalysisData?.team_fit_considerations || discAnalysisData?.team_fit,
    } : undefined;
    
    // Parse interview analysis
    const interviewAnalysisData = interviewAnalysisDoc?.analysis as any;
    const interviewAnalysis = interviewAnalysisDoc?.status === 'completed' ? {
      summary: interviewAnalysisData?.summary || interviewAnalysisDoc?.summary,
      performanceAssessment: interviewAnalysisData?.performance_assessment,
      strengthsIdentified: interviewAnalysisData?.strengths_identified,
      concernsIdentified: interviewAnalysisData?.concerns_identified,
      scoreChangeExplanation: interviewAnalysisData?.score_change_explanation,
    } : undefined;
    
    // Build business case responses
    const bcResponses = businessCases.map(bc => {
      const response = businessCaseResponses.find(r => r.business_case_id === bc.id);
      return {
        questionTitle: bc.question_title,
        questionDescription: bc.question_description,
        response: response?.text_response || 'No response submitted',
      };
    }).filter(r => r.response !== 'No response submitted');
    
    // Build interview questions with notes
    const interviewQs = interviewQuestions.map(q => ({
      question: q.question_text,
      category: q.category,
      reasoning: q.reasoning || undefined,
      recruiterNote: q.recruiter_note || undefined,
    }));
    
    // Build fixed questions with notes
    const fixedQs = fixedQuestions.map(fq => {
      const note = fixedQuestionNotes.find(n => n.fixed_question_id === fq.id);
      return {
        question: fq.question_text,
        category: fq.category,
        note: note?.note_text || undefined,
      };
    });
    
    // Get latest interview evaluation
    const latestEvaluation = interviewEvaluations[0];
    const interviewEvaluation = latestEvaluation ? {
      overallImpression: latestEvaluation.overall_impression || undefined,
      strengths: latestEvaluation.strengths || undefined,
      areasForImprovement: latestEvaluation.areas_for_improvement || undefined,
      technicalScore: latestEvaluation.technical_score || undefined,
      communicationScore: latestEvaluation.communication_score || undefined,
      culturalFitScore: latestEvaluation.cultural_fit_score || undefined,
      problemSolvingScore: latestEvaluation.problem_solving_score || undefined,
      recommendation: latestEvaluation.recommendation || undefined,
    } : undefined;
    
    // Build recruiter notes
    const notes = recruiterNotes.map(n => ({
      note: n.note_text,
      createdAt: n.created_at,
    }));
    
    // Build scheduled interviews
    const scheduledInterviews = interviews.map(i => ({
      date: i.interview_date,
      type: i.interview_type,
      status: i.status,
    }));
    
    // Build hiring decisions
    const decisions = hiringDecisions.map(d => ({
      decision: d.decision,
      reasoning: d.reasoning,
      createdAt: d.created_at,
    }));
    
    return {
      // Basic info
      id: application.id,
      name: application.candidate_name || application.profile.full_name || 'Unknown',
      email: application.candidate_email || application.profile.email || undefined,
      jobTitle: application.job.title,
      jobId: application.job_id,
      status: application.status,
      appliedAt: application.created_at,
      
      // AI Evaluation
      aiScore: aiEvaluation?.overall_score ?? null,
      recommendation: aiEvaluation?.recommendation ?? null,
      strengths: aiEvaluation?.strengths || undefined,
      concerns: aiEvaluation?.concerns || undefined,
      evaluationSummary: aiEvaluation?.summary || undefined,
      skillsMatchScore: aiEvaluation?.skills_match_score ?? undefined,
      communicationScore: aiEvaluation?.communication_score ?? undefined,
      culturalFitScore: aiEvaluation?.cultural_fit_score ?? undefined,
      evaluationStage: aiEvaluation?.evaluation_stage || undefined,
      initialScore: aiEvaluation?.initial_overall_score ?? undefined,
      
      // Full analyses
      cvAnalysis,
      discAnalysis,
      
      // Business case responses
      businessCaseResponses: bcResponses.length > 0 ? bcResponses : undefined,
      
      // Interview questions
      interviewQuestions: interviewQs.length > 0 ? interviewQs : undefined,
      fixedQuestionNotes: fixedQs.length > 0 ? fixedQs : undefined,
      
      // Interview evaluation and analysis
      interviewEvaluation,
      interviewAnalysis,
      
      // Recruiter notes
      recruiterNotes: notes.length > 0 ? notes : undefined,
      
      // Scheduled interviews
      scheduledInterviews: scheduledInterviews.length > 0 ? scheduledInterviews : undefined,
      
      // Hiring decisions
      hiringDecisions: decisions.length > 0 ? decisions : undefined,
    };
  }, [
    application, 
    aiEvaluation, 
    documentAnalyses, 
    businessCases, 
    businessCaseResponses,
    interviewQuestions,
    fixedQuestions,
    fixedQuestionNotes,
    interviewEvaluations,
    recruiterNotes,
    interviews,
    hiringDecisions,
  ]);

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
    <DashboardLayout showDashboardLink>
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
          canEdit={canEdit}
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
          <TabsList className="w-full justify-start mb-4 bg-muted/50 p-1 rounded-lg border border-border/50">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-young-sm">
              <Briefcase className="w-4 h-4" />
              Overview
              {application.ai_evaluation_status === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--young-gold))] animate-pulse" />
              )}
              {aiEvaluation && (
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--young-blue))]" />
              )}
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-young-sm">
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

      {/* Context-Aware AI Assistant - temporarily hidden
      {canEdit && candidateContext && <CandidateAIAssistant candidateContext={candidateContext} />}
      */}
    </DashboardLayout>
  );
}