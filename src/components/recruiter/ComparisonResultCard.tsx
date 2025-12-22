import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal, Award, AlertTriangle, CheckCircle, Target, FileText, Loader2, FileQuestion, Brain, ChevronDown, ChevronUp, Expand, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ComparisonResult } from '@/hooks/useCandidateComparison';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { InterviewPerformanceSection } from './InterviewPerformanceSection';
import { BCQVideoPerformanceSection } from './BCQVideoPerformanceSection';
import { StageProgressionSection } from './StageProgressionSection';
import { ComparisonAIAssistant } from './ComparisonAIAssistant';
import type { PresentationContent, ViableCandidate, CandidateRanking, ComparisonMatrixItem, BusinessCaseAnalysisItem, InterviewPerformanceItem, CandidateRisk } from './ExecutiveReportContent';

interface ComparisonResultCardProps {
  result: ComparisonResult;
  jobTitle?: string;
  jobId?: string;
}

export function ComparisonResultCard({ result, jobTitle = 'Position', jobId }: ComparisonResultCardProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  // Create comparison context for AI assistant
  const comparisonContext = useMemo(() => ({
    jobTitle,
    jobId,
    candidateCount: result.rankings.length,
    result,
  }), [jobTitle, jobId, result]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    presentationContent: PresentationContent;
    viableCandidates: ViableCandidate[];
    allRankings: CandidateRanking[];
    comparisonMatrix: ComparisonMatrixItem[];
    businessCaseAnalysis: BusinessCaseAnalysisItem[];
    interviewPerformance: InterviewPerformanceItem[];
    risks: CandidateRisk[];
    confidence: 'high' | 'medium' | 'low';
  } | null>(null);
  const { toast } = useToast();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-medium">{rank}</span>;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Low Confidence</Badge>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleExportExecutiveReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-presentation-report', {
        body: { comparisonResult: result, jobTitle },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Transform snake_case API response to camelCase expected by ExecutiveReportContent
      const apiContent = data.presentationContent || {};
      const winnerSpotlight = apiContent.winner_spotlight || {};
      const nextStepsData = apiContent.next_steps || {};

      // Get alternative candidate info from the comparison result
      const alternativeName = result.recommendation.alternative;
      const alternativeRanking = alternativeName && alternativeName !== 'None' 
        ? result.rankings.find(r => r.candidate_name === alternativeName)
        : null;

      const transformedContent: PresentationContent = {
        executiveSummary: apiContent.executive_narrative || '',
        topRecommendation: {
          name: winnerSpotlight.name || '',
          score: winnerSpotlight.score || 0,
          whyChosen: winnerSpotlight.why_chosen || '',
          keyStrengths: winnerSpotlight.key_strengths || [],
        },
        alternativeOption: alternativeRanking ? {
          name: alternativeName,
          score: alternativeRanking.score,
          justification: result.recommendation.alternative_justification || '',
        } : undefined,
        keyInsights: apiContent.key_insights || [],
        considerations: apiContent.considerations || [],
        nextSteps: nextStepsData.actions || [],
        timeline: nextStepsData.timeline || '',
      };

      // Transform viableCandidates (already in correct format from API)
      const transformedCandidates: ViableCandidate[] = (data.viableCandidates || []).map((c: any) => ({
        name: c.name || '',
        score: c.score || 0,
        strengths: c.strengths || [],
        keyDifferentiator: c.keyDifferentiator || c.key_differentiator || '',
      }));

      const confidence = data.confidence || 'medium';

      // Transform interview performance data
      const transformedInterviewPerformance: InterviewPerformanceItem[] = (result.interview_performance_analysis || []).map((ip: any) => ({
        application_id: ip.application_id || '',
        candidate_name: ip.candidate_name || '',
        has_interview: ip.has_interview ?? (ip.interview_score !== undefined),
        interview_score: ip.interview_score,
        application_vs_interview: ip.interview_vs_application || ip.application_vs_interview,
        score_trajectory: ip.score_trajectory,
        strengths_demonstrated: ip.strengths_demonstrated || ip.key_observations?.filter((_: any, i: number) => i < 3),
        concerns_raised: ip.concerns_raised || [],
      }));

      // Store data and open modal for preview
      setReportData({ 
        presentationContent: transformedContent, 
        viableCandidates: transformedCandidates, 
        allRankings: result.rankings,
        comparisonMatrix: result.comparison_matrix,
        businessCaseAnalysis: result.business_case_analysis || [],
        interviewPerformance: transformedInterviewPerformance,
        risks: result.risks || [],
        confidence 
      });
      setReportModalOpen(true);

      toast({
        title: 'Report Ready',
        description: 'Preview the report and print/save as PDF.',
      });
    } catch (error) {
      console.error('Error generating executive report:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate executive report',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end items-center gap-3 pr-4 py-2 border-b border-muted/30 mb-4">
        <Button 
          onClick={() => setIsAIOpen(true)}
          className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A] font-semibold shadow-md"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Ask AI
        </Button>
        <Button 
          onClick={handleExportExecutiveReport} 
          disabled={isGeneratingReport}
          className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A] font-semibold shadow-md"
        >
          {isGeneratingReport ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isGeneratingReport ? 'Generating...' : 'AI Report'}
        </Button>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.rankings.map((ranking) => (
              <div
                key={ranking.application_id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition-all',
                  ranking.rank === 1 
                    ? 'bg-[#B88F5E]/10 border-2 border-[#B88F5E]/30 shadow-sm' 
                    : 'bg-muted/40 border border-muted/60 hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-2 min-w-[60px]">
                  {getRankIcon(ranking.rank)}
                  <span className="text-lg font-bold text-foreground/80">#{ranking.rank}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm tracking-tight">{ranking.candidate_name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{ranking.key_differentiator}</p>
                </div>

                <div className={cn('text-2xl font-bold tabular-nums min-w-[60px] text-right', getScoreColor(ranking.score))}>
                  {ranking.score}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-xl font-bold">{result.recommendation.top_choice}</p>
              <div className="flex items-center gap-2 mt-1">
                {getConfidenceBadge(result.recommendation.confidence)}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="font-medium mb-2">Why this candidate?</p>
            <p className="text-muted-foreground">{result.recommendation.justification}</p>
          </div>

          {result.recommendation.alternative && result.recommendation.alternative !== 'None' && (
            <>
              <Separator />
              <div>
                <p className="font-medium mb-2">Alternative Option: {result.recommendation.alternative}</p>
                <p className="text-muted-foreground">{result.recommendation.alternative_justification}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Comparison Matrix - Accordion Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {result.comparison_matrix.map((row, idx) => (
              <AccordionItem 
                key={idx} 
                value={`criterion-${idx}`}
                className="border rounded-lg px-4 data-[state=open]:bg-muted/20"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold text-sm">{row.criterion}</span>
                    <div className="flex items-center gap-2">
                      {row.candidates.map((c) => {
                        const candidateName = result.rankings.find(r => r.application_id === c.application_id)?.candidate_name || '';
                        return (
                          <div key={c.application_id} className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground hidden sm:inline">{candidateName.split(' ')[0]}:</span>
                            <Badge className={cn(
                              "text-xs font-bold min-w-[40px] justify-center",
                              c.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              c.score >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                              {c.score}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 md:grid-cols-2 pt-2">
                    {row.candidates.map((c) => {
                      const candidate = result.rankings.find(r => r.application_id === c.application_id);
                      const isTopCandidate = candidate?.rank === 1;
                      return (
                        <div 
                          key={c.application_id}
                          className={cn(
                            "rounded-lg p-3 border",
                            isTopCandidate 
                              ? "bg-[#B88F5E]/5 border-[#B88F5E]/30" 
                              : "bg-muted/30 border-muted/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm flex items-center gap-1.5">
                              {candidate?.candidate_name}
                              {isTopCandidate && <Trophy className="w-3.5 h-3.5 text-[#B88F5E]" />}
                            </span>
                            <Badge className={cn(
                              "text-xs font-bold",
                              c.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              c.score >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                              {c.score}/100
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {c.notes}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {result.risks.filter(r => r.risks.length > 0 || result.rankings.find(rank => rank.candidate_name === r.candidate_name)?.score > 0).map((risk) => {
              const candidateRank = result.rankings.find(rank => rank.candidate_name === risk.candidate_name);
              const isTopCandidate = candidateRank?.rank === 1;
              
              return (
                <div 
                  key={risk.application_id} 
                  className={cn(
                    "rounded-xl p-4 border transition-all",
                    isTopCandidate 
                      ? "bg-[#B88F5E]/5 border-[#B88F5E]/30" 
                      : "bg-muted/30 border-muted/50 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      isTopCandidate 
                        ? "bg-[#B88F5E]/20 text-[#B88F5E]" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      #{candidateRank?.rank || '-'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm tracking-tight">{risk.candidate_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {risk.risks.length === 0 ? 'Low risk profile' : `${risk.risks.length} risk${risk.risks.length > 1 ? 's' : ''} identified`}
                      </p>
                    </div>
                  </div>
                  
                  {risk.risks.length > 0 ? (
                    <ul className="space-y-1.5">
                      {risk.risks.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <span className="text-muted-foreground leading-relaxed line-clamp-2">{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-muted-foreground">No significant risks identified</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Progression Comparison - NEW 4-phase workflow */}
      {result.stage_progression && result.stage_progression.length > 0 && (
        <StageProgressionSection
          stageProgression={result.stage_progression}
          phaseCompletion={result.phase_completion}
          rankings={result.rankings}
        />
      )}

      {/* BCQ Video Performance - NEW */}
      {result.bcq_video_performance && result.bcq_video_performance.length > 0 && (
        <BCQVideoPerformanceSection
          bcqVideoPerformance={result.bcq_video_performance}
          rankings={result.rankings}
        />
      )}

      {/* Interview Performance Analysis */}
      {result.interview_performance_analysis && result.interview_performance_analysis.length > 0 && (
        <InterviewPerformanceSection 
          interviewAnalysis={result.interview_performance_analysis}
          rankings={result.rankings}
        />
      )}

      {/* Business Case Analysis */}
      {result.business_case_analysis && result.business_case_analysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary" />
              Business Case Responses Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {result.business_case_analysis.map((question, qIdx) => (
              <div key={qIdx} className="space-y-4">
                {/* Question Header - Full description visible */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg">
                    Question {qIdx + 1}: {question.question_title}
                  </h4>
                  {question.question_description && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {question.question_description}
                    </p>
                  )}
                </div>

                {/* Candidate Responses - Expandable */}
                <div className="space-y-3">
                  {question.candidate_responses.map((resp) => {
                    const isBest = resp.candidate_name === question.best_response;
                    return (
                      <Collapsible key={resp.application_id} defaultOpen={isBest}>
                        <div 
                          className={cn(
                            "border rounded-xl transition-all",
                            isBest 
                              ? "border-[#B88F5E] bg-[#B88F5E]/5 shadow-sm" 
                              : "border-muted/60 hover:border-muted"
                          )}
                        >
                          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
                                {resp.candidate_name}
                                {isBest && (
                                  <Trophy className="w-4 h-4 text-[#B88F5E]" />
                                )}
                              </span>
                              <Badge className={cn(
                                "text-xs font-medium",
                                resp.score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                resp.score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              )}>
                                {resp.score}/100
                              </Badge>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="px-4 pb-4">
                            <div className="pt-2 border-t border-muted/30 space-y-3">
                              {/* Full Response */}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Response</p>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                  {resp.response_summary || 'No response provided'}
                                </p>
                              </div>
                              
                              {/* Full Assessment */}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">AI Assessment</p>
                                <p className="text-sm italic text-[#93B1FF] leading-relaxed whitespace-pre-wrap">
                                  {resp.assessment}
                                </p>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>

                {/* AI Comparative Analysis - Full text */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-medium">AI Comparative Analysis</span>
                    <Badge variant="outline" className="ml-auto">
                      Best: {question.best_response}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.comparative_analysis}</p>
                </div>

                {qIdx < (result.business_case_analysis?.length || 0) - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Executive Report Modal */}
      <ExecutiveReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        presentationContent={reportData?.presentationContent || null}
        viableCandidates={reportData?.viableCandidates || []}
        allRankings={reportData?.allRankings || []}
        comparisonMatrix={reportData?.comparisonMatrix || []}
        businessCaseAnalysis={reportData?.businessCaseAnalysis || []}
        interviewPerformance={reportData?.interviewPerformance || []}
        risks={reportData?.risks || []}
        confidence={reportData?.confidence || 'medium'}
        jobTitle={jobTitle}
      />

      {/* Young AI Assistant for Comparison Drill-Down */}
      <ComparisonAIAssistant comparisonContext={comparisonContext} isOpen={isAIOpen} onOpenChange={setIsAIOpen} />
    </div>
  );
}
