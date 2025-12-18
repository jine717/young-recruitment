import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileVideo, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  FileText,
  Sparkles,
  Lightbulb,
  MessageSquare
} from 'lucide-react';

// Calculate combined overall score: 80% Content Quality + 20% English Fluency
const calculateOverallScore = (contentScore: number | null | undefined, fluencyScore: number | null | undefined) => {
  if (contentScore === null || contentScore === undefined) return null;
  if (fluencyScore === null || fluencyScore === undefined) return Math.round(contentScore);
  return Math.round(contentScore * 0.8 + fluencyScore * 0.2);
};
import { useSendBCQInvitation } from '@/hooks/useSendBCQInvitation';
import { useBusinessCases, useBusinessCaseResponses } from '@/hooks/useBusinessCase';
import { useAnalyzeBCQResponse } from '@/hooks/useBCQResponseAnalysis';
import { useTranscribeBCQResponse } from '@/hooks/useTranscribeBCQResponse';
import { PostBCQAnalysisModal } from './PostBCQAnalysisModal';
import { format } from 'date-fns';
import { type ReviewProgress } from '@/hooks/useReviewProgress';

const QUESTIONS_PER_PAGE = 3;

interface BCQTabProps {
  applicationId: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  canEdit: boolean;
  bcqAccessToken: string | null;
  bcqInvitationSentAt: string | null;
  bcqLinkOpenedAt: string | null;
  bcqStartedAt: string | null;
  businessCaseCompleted: boolean;
  businessCaseCompletedAt: string | null;
  bcqResponseTimeMinutes: number | null;
  bcqDelayed: boolean | null;
  reviewProgress: ReviewProgress | null;
  applicationStatus: string;
  evaluationStage: string | null;
}

export function BCQTab({
  applicationId,
  jobId,
  candidateName,
  candidateEmail,
  canEdit,
  bcqAccessToken,
  bcqInvitationSentAt,
  businessCaseCompleted,
  businessCaseCompletedAt,
  bcqResponseTimeMinutes,
  bcqDelayed,
  reviewProgress,
  applicationStatus,
  evaluationStage,
}: BCQTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const sendBCQInvitation = useSendBCQInvitation();
  const { data: businessCases = [] } = useBusinessCases(jobId);
  const { data: responses = [] } = useBusinessCaseResponses(applicationId);

  // Gate: Check if all 3 review sections are completed
  const canSendBCQ = reviewProgress && 
    reviewProgress.ai_analysis_reviewed &&
    reviewProgress.cv_analysis_reviewed &&
    reviewProgress.disc_analysis_reviewed;

  const handleSendInvitation = () => {
    if (!bcqAccessToken || !canSendBCQ) return;
    
    sendBCQInvitation.mutate({
      applicationId,
      bcqAccessToken,
      candidateEmail,
      candidateName,
      jobTitle: '',
    });
  };

  const formatResponseTime = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Determine current status
  const getStatus = () => {
    if (businessCaseCompleted) return 'completed';
    if (bcqInvitationSentAt) return 'sent';
    return 'not_sent';
  };

  const status = getStatus();

  // Pagination
  const totalPages = Math.ceil(businessCases.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = businessCases.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

  // Status badge component
  const StatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <Badge className={bcqDelayed 
            ? 'bg-destructive/20 text-destructive border-destructive/30' 
            : 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/30'
          }>
            {bcqDelayed ? (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Completed (Delayed)
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </>
            )}
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-[hsl(var(--young-khaki))]/20 text-[hsl(var(--young-khaki))] border-[hsl(var(--young-khaki))]/30">
            <Clock className="w-3 h-3 mr-1" />
            Awaiting Response
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Not Sent
          </Badge>
        );
    }
  };

  // No business cases configured
  if (businessCases.length === 0) {
    return (
      <Card className="shadow-young-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-[hsl(var(--young-khaki))]" />
            Business Case Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileVideo className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No BCQ Configured</p>
            <p className="text-xs mt-1">This job has no business case questions set up.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main BCQ Card - Collapsible */}
      <Card className="shadow-young-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-[hsl(var(--young-khaki))]" />
                  Business Case Questions
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge />
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Not Sent State - with Review Gate */}
              {status === 'not_sent' && (
                <div className="text-center py-6">
                  {!canSendBCQ ? (
                    <>
                      <Lock className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--young-khaki))] opacity-70" />
                      <p className="text-sm font-medium mb-1">Complete Initial Review First</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Review AI Analysis, CV, and DISC before sending the BCQ invitation.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {!reviewProgress?.ai_analysis_reviewed && (
                          <Badge variant="outline" className="text-xs">AI Analysis pending</Badge>
                        )}
                        {!reviewProgress?.cv_analysis_reviewed && (
                          <Badge variant="outline" className="text-xs">CV Analysis pending</Badge>
                        )}
                        {!reviewProgress?.disc_analysis_reviewed && (
                          <Badge variant="outline" className="text-xs">DISC Analysis pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {businessCases.length} question{businessCases.length !== 1 ? 's' : ''} configured
                      </p>
                    </>
                  ) : (
                    <>
                      <Send className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--young-blue))] opacity-70" />
                      <p className="text-sm font-medium mb-1">Ready to Send BCQ</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Send the business case assessment to this candidate via email.
                      </p>
                      {canEdit && bcqAccessToken && (
                        <Button
                          onClick={handleSendInvitation}
                          disabled={sendBCQInvitation.isPending}
                          className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-[hsl(var(--young-bold-black))]"
                        >
                          {sendBCQInvitation.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send BCQ Invitation
                            </>
                          )}
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-4">
                        {businessCases.length} question{businessCases.length !== 1 ? 's' : ''} configured
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Sent or Completed State - Professional Grid Timeline */}
              {(status === 'sent' || status === 'completed') && (
                <div className="space-y-0">
                  {/* Two-Column Grid with Divider */}
                  <div className="grid grid-cols-2 divide-x divide-border">
                    {/* Column 1: Invitation Sent */}
                    <div className="pr-4 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Invitation Sent
                      </p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--young-blue))]" />
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-medium">
                            {format(new Date(bcqInvitationSentAt!), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(bcqInvitationSentAt!), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Column 2: BCQ Completed */}
                    <div className="pl-4 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        BCQ Completed
                      </p>
                      <div className="flex items-center gap-2">
                        {businessCaseCompletedAt ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--young-blue))]" />
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-medium">
                                {format(new Date(businessCaseCompletedAt), 'MMM d, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(businessCaseCompletedAt), 'HH:mm')}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-[hsl(var(--young-khaki))]" />
                            <span className="text-sm text-muted-foreground">Awaiting</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Response Time with 24h color indicator */}
                  {status === 'completed' && bcqResponseTimeMinutes !== null && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Response Time
                      </span>
                      <div className="flex items-center gap-1.5">
                        {bcqResponseTimeMinutes < 1440 ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${
                          bcqResponseTimeMinutes < 1440 ? 'text-green-600' : 'text-destructive'
                        }`}>
                          {formatResponseTime(bcqResponseTimeMinutes)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resend Invitation */}
                  {status === 'sent' && canEdit && bcqAccessToken && (
                    <div className="pt-3 mt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendInvitation}
                        disabled={sendBCQInvitation.isPending}
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${sendBCQInvitation.isPending ? 'animate-spin' : ''}`} />
                        Resend Invitation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Questions Card - Show when BCQ sent or completed */}
      {status !== 'not_sent' && businessCases.length > 0 && (
        <Card className="shadow-young-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-[hsl(var(--young-khaki))]" />
              Questions
              <Badge variant="secondary" className="ml-auto">
                {responses.filter(r => r.completed_at).length}/{businessCases.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paginatedQuestions.map((bc) => {
              const response = responses.find(r => r.business_case_id === bc.id);
              const isCompleted = !!response?.completed_at;

              return (
                <ResponseCard
                  key={bc.id}
                  responseId={response?.id}
                  applicationId={applicationId}
                  questionNumber={bc.question_number}
                  questionTitle={bc.question_title}
                  questionDescription={bc.question_description}
                  videoUrl={response?.video_url}
                  videoCreatedAt={response?.created_at}
                  transcription={response?.transcription}
                  isCompleted={isCompleted}
                  canEdit={canEdit}
                  fluencyPronunciationScore={response?.fluency_pronunciation_score}
                  fluencyPaceScore={response?.fluency_pace_score}
                  fluencyHesitationScore={response?.fluency_hesitation_score}
                  fluencyGrammarScore={response?.fluency_grammar_score}
                  fluencyOverallScore={response?.fluency_overall_score}
                  fluencyNotes={response?.fluency_notes}
                  contentQualityScore={response?.content_quality_score}
                  contentStrengths={response?.content_strengths}
                  contentAreasToProbe={response?.content_areas_to_probe}
                  contentSummary={response?.content_summary}
                  contentAnalysisStatus={response?.content_analysis_status}
                />
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview + BCQ Analysis Card - Show when BCQ completed and not yet analyzed */}
      {businessCaseCompleted && (
        <Card className={`shadow-young-sm border-2 ${
          evaluationStage === 'post_bcq' 
            ? 'border-green-500/50 bg-green-50/30' 
            : 'border-[hsl(var(--young-gold))]/50'
        }`}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${
                evaluationStage === 'post_bcq' 
                  ? 'text-green-600' 
                  : 'text-[hsl(var(--young-gold))]'
              }`} />
              Overview + BCQ Analysis
              {evaluationStage === 'post_bcq' && (
                <Badge className="bg-green-500/20 text-green-700 border-green-500/30 ml-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </CardTitle>
            {canEdit && evaluationStage !== 'post_bcq' && (
              <Button
                onClick={() => setShowAnalysisModal(true)}
                className="bg-[hsl(var(--young-gold))] hover:bg-[hsl(var(--young-gold))]/90 text-[hsl(var(--young-bold-black))]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Run Analysis
              </Button>
            )}
            {canEdit && evaluationStage === 'post_bcq' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysisModal(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {evaluationStage === 'post_bcq' ? (
              <p className="text-sm text-muted-foreground">
                Comprehensive analysis completed. AI has re-evaluated the candidate considering CV, DISC, and BCQ responses. 
                The candidate is now ready for the interview phase.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Complete the comprehensive evaluation before moving to the interview phase. 
                  AI will analyze all available data: CV, DISC profile, and BCQ responses.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  Interview scheduling will be unlocked after this analysis
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post BCQ Analysis Modal */}
      <PostBCQAnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        applicationId={applicationId}
        candidateName={candidateName}
      />
    </div>
  );
}

// Response Card Component
interface ResponseCardProps {
  responseId?: string;
  applicationId: string;
  questionNumber: number;
  questionTitle: string;
  questionDescription: string;
  videoUrl?: string | null;
  videoCreatedAt?: string | null;
  transcription?: string | null;
  isCompleted: boolean;
  canEdit: boolean;
  fluencyPronunciationScore?: number | null;
  fluencyPaceScore?: number | null;
  fluencyHesitationScore?: number | null;
  fluencyGrammarScore?: number | null;
  fluencyOverallScore?: number | null;
  fluencyNotes?: string | null;
  contentQualityScore?: number | null;
  contentStrengths?: string[] | null;
  contentAreasToProbe?: string[] | null;
  contentSummary?: string | null;
  contentAnalysisStatus?: string | null;
}

function ResponseCard({
  responseId,
  applicationId,
  questionNumber,
  questionTitle,
  questionDescription,
  videoUrl,
  videoCreatedAt,
  transcription,
  isCompleted,
  canEdit,
  fluencyPronunciationScore,
  fluencyPaceScore,
  fluencyHesitationScore,
  fluencyGrammarScore,
  fluencyOverallScore,
  fluencyNotes,
  contentQualityScore,
  contentStrengths,
  contentAreasToProbe,
  contentSummary,
  contentAnalysisStatus,
}: ResponseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const analyzeResponse = useAnalyzeBCQResponse();
  const transcribeResponse = useTranscribeBCQResponse();

  const handleAnalyze = () => {
    if (!responseId) return;
    analyzeResponse.mutate(responseId);
  };

  const handleTranscribe = () => {
    if (!responseId || !videoUrl) return;
    transcribeResponse.mutate({ responseId, videoUrl, applicationId });
  };

  const hasContentAnalysis = contentAnalysisStatus === 'completed' && contentQualityScore !== null;
  const isAnalyzing = contentAnalysisStatus === 'analyzing' || analyzeResponse.isPending;
  const isTranscribing = transcribeResponse.isPending;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          {/* Clickable area for collapse/expand */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted 
                  ? 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))]' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {questionNumber}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{questionTitle}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{questionDescription}</p>
              </div>
            </div>
          </CollapsibleTrigger>
          
          {/* Badges area - outside CollapsibleTrigger so tooltips work */}
          <div className="flex items-center gap-2">
            {/* Score badge with tooltip */}
            {contentQualityScore !== null && contentQualityScore !== undefined && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help">
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-semibold ${
                          (() => {
                            const overallScore = calculateOverallScore(contentQualityScore, fluencyOverallScore);
                            if (overallScore === null) return '';
                            return overallScore >= 71 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : overallScore >= 41 
                                ? 'bg-orange-100 text-orange-700 border-orange-300' 
                                : 'bg-red-100 text-red-700 border-red-300';
                          })()
                        }`}
                      >
                        {calculateOverallScore(contentQualityScore, fluencyOverallScore)}
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs font-medium">Overall Score: 80% Content Quality + 20% English Fluency</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Analysis status badge - only show when answered */}
            {isCompleted && (
              <Badge 
                variant="outline" 
                className={
                  hasContentAnalysis 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-muted text-muted-foreground'
                }
              >
                {hasContentAnalysis ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Analyzed
                  </>
                ) : (
                  'Not analyzed'
                )}
              </Badge>
            )}
            {/* Answered/Pending badge */}
            <Badge variant={isCompleted ? 'default' : 'outline'} className={
              isCompleted 
                ? 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/30 hover:bg-[hsl(var(--young-blue))]/30' 
                : ''
            }>
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Answered
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </Badge>
            {/* Chevron - clicking this area also works for collapse */}
            <CollapsibleTrigger asChild>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform cursor-pointer ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-4">
            {isCompleted && videoUrl ? (
              <>
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={videoUrl && videoCreatedAt 
                      ? `${videoUrl}?t=${new Date(videoCreatedAt).getTime()}` 
                      : videoUrl ?? undefined
                    } 
                    controls 
                    className="w-full h-full"
                    preload="metadata"
                  />
                </div>
                
                {/* Transcription */}
                {transcription && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Transcription
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {transcription}
                    </p>
                  </div>
                )}

                {/* Response Analysis Section (includes English Fluency + Content Quality) */}
                <div className="bg-[hsl(var(--young-gold))]/5 rounded-lg p-4 border border-[hsl(var(--young-gold))]/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Response Analysis
                    </p>
                    {canEdit && transcription && !hasContentAnalysis && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="h-7 text-xs"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1.5" />
                            Analyze
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Show content based on state */}
                  {transcription ? (
                    <div className="space-y-4">
                      {/* ENGLISH FLUENCY Section */}
                      {fluencyOverallScore !== null && fluencyOverallScore !== undefined && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--young-blue))] mb-2">
                            English Fluency (Audio)
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center p-2 bg-background rounded-lg shadow-sm cursor-help">
                                    <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                                      {fluencyPronunciationScore ?? '-'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Pronunciation</p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">Clarity of speech, accent clarity, and word pronunciation accuracy</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center p-2 bg-background rounded-lg shadow-sm cursor-help">
                                    <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                                      {fluencyPaceScore ?? '-'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Pace</p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">Speaking speed, natural rhythm, and flow of speech</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center p-2 bg-background rounded-lg shadow-sm cursor-help">
                                    <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                                      {fluencyHesitationScore ?? '-'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Fluidity</p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">Smoothness of speech - fewer "um", "uh", pauses = higher score</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center p-2 bg-background rounded-lg shadow-sm cursor-help">
                                    <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                                      {fluencyGrammarScore ?? '-'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Grammar</p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">Grammatical correctness in spoken sentences</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center p-2 bg-[hsl(var(--young-blue))]/10 rounded-lg shadow-sm col-span-2 sm:col-span-1 cursor-help">
                                    <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                                      {fluencyOverallScore}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Overall</p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">Combined English fluency score from audio analysis</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {fluencyNotes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {fluencyNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* CONTENT QUALITY Section */}
                      {hasContentAnalysis ? (
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--young-gold))] mb-3">
                            Content Quality
                          </p>
                          
                          {/* Quality Score */}
                          <div className="flex items-center gap-3 mb-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--young-gold))]/20 flex items-center justify-center cursor-help">
                                    <span className="text-lg font-bold text-[hsl(var(--young-gold))]">
                                      {contentQualityScore}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">Measures how completely and effectively the candidate addressed the question</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div>
                              <p className="text-sm font-medium">Quality Score</p>
                              <p className="text-xs text-muted-foreground">How well the response addresses the question</p>
                            </div>
                          </div>

                          {/* Summary */}
                          {contentSummary && (
                            <div className="bg-background rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Summary</span>
                              </div>
                              <p className="text-sm text-foreground/90">{contentSummary}</p>
                            </div>
                          )}

                          {/* Strengths */}
                          {contentStrengths && contentStrengths.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--young-blue))]" />
                                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Strengths</span>
                              </div>
                              <ul className="space-y-1.5">
                                {contentStrengths.map((strength, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-[hsl(var(--young-blue))] mt-1">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Areas to Probe */}
                          {contentAreasToProbe && contentAreasToProbe.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Lightbulb className="w-3.5 h-3.5 text-[hsl(var(--young-gold))]" />
                                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Areas to Probe in Interview</span>
                              </div>
                              <ul className="space-y-1.5">
                                {contentAreasToProbe.map((area, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-[hsl(var(--young-gold))] mt-1">•</span>
                                    <span>{area}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-muted-foreground border-t border-border/50 mt-3">
                          <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Click "Analyze" to generate content analysis</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {videoUrl && canEdit ? (
                        <>
                          <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm mb-3">Video recorded but not transcribed</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTranscribe}
                            disabled={isTranscribing}
                          >
                            {isTranscribing ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                                Transcribing...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3 h-3 mr-1.5" />
                                Transcribe Now
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Waiting for transcription</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No response recorded yet</p>
                <p className="text-xs mt-1">Waiting for candidate to complete this question</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
