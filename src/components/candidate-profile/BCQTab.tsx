import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { useSendBCQInvitation } from '@/hooks/useSendBCQInvitation';
import { useBusinessCases, useBusinessCaseResponses } from '@/hooks/useBusinessCase';
import { useAnalyzeBCQResponse } from '@/hooks/useBCQResponseAnalysis';
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
}: BCQTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
    </div>
  );
}

// Response Card Component
interface ResponseCardProps {
  responseId?: string;
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

  const handleAnalyze = () => {
    if (!responseId) return;
    analyzeResponse.mutate(responseId);
  };

  const hasContentAnalysis = contentAnalysisStatus === 'completed' && contentQualityScore !== null;
  const isAnalyzing = contentAnalysisStatus === 'analyzing' || analyzeResponse.isPending;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted 
                  ? 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))]' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {questionNumber}
              </div>
              <div>
                <h4 className="font-medium text-sm">{questionTitle}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{questionDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        
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

                {/* English Fluency Analysis Section */}
                {fluencyOverallScore !== null && fluencyOverallScore !== undefined && (
                  <div className="bg-[hsl(var(--young-blue))]/5 rounded-lg p-4 border border-[hsl(var(--young-blue))]/20">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      English Fluency Analysis
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="text-center p-2 bg-background rounded-lg shadow-sm">
                        <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                          {fluencyPronunciationScore ?? '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Pronunciation</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded-lg shadow-sm">
                        <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                          {fluencyPaceScore ?? '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Pace</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded-lg shadow-sm">
                        <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                          {fluencyHesitationScore ?? '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Fluidity</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded-lg shadow-sm">
                        <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                          {fluencyGrammarScore ?? '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Grammar</p>
                      </div>
                      <div className="text-center p-2 bg-[hsl(var(--young-blue))]/10 rounded-lg shadow-sm col-span-2 sm:col-span-1">
                        <p className="text-lg font-bold text-[hsl(var(--young-blue))]">
                          {fluencyOverallScore}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">Overall</p>
                      </div>
                    </div>
                    {fluencyNotes && (
                      <p className="text-xs text-muted-foreground mt-3 italic border-t pt-3">
                        {fluencyNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Response Analysis Section */}
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

                  {hasContentAnalysis ? (
                    <div className="space-y-4">
                      {/* Quality Score */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-[hsl(var(--young-gold))]/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-[hsl(var(--young-gold))]">
                            {contentQualityScore}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Quality Score</p>
                          <p className="text-xs text-muted-foreground">How well the response addresses the question</p>
                        </div>
                      </div>

                      {/* Summary */}
                      {contentSummary && (
                        <div className="bg-background rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Summary</span>
                          </div>
                          <p className="text-sm text-foreground/90">{contentSummary}</p>
                        </div>
                      )}

                      {/* Strengths */}
                      {contentStrengths && contentStrengths.length > 0 && (
                        <div>
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
                    <div className="text-center py-4 text-muted-foreground">
                      {transcription ? (
                        <>
                          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Click "Analyze" to generate AI insights</p>
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
