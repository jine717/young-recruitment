import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal, Award, AlertTriangle, CheckCircle, Target, FileText, Loader2, FileQuestion, Brain } from 'lucide-react';
import type { ComparisonResult } from '@/hooks/useCandidateComparison';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import type { PresentationContent, ViableCandidate, CandidateRanking, ComparisonMatrixItem, BusinessCaseAnalysisItem } from './ExecutiveReportContent';

interface ComparisonResultCardProps {
  result: ComparisonResult;
  jobTitle?: string;
}

export function ComparisonResultCard({ result, jobTitle = 'Position' }: ComparisonResultCardProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    presentationContent: PresentationContent;
    viableCandidates: ViableCandidate[];
    allRankings: CandidateRanking[];
    comparisonMatrix: ComparisonMatrixItem[];
    businessCaseAnalysis: BusinessCaseAnalysisItem[];
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

      const transformedContent: PresentationContent = {
        executiveSummary: apiContent.executive_narrative || '',
        topRecommendation: {
          name: winnerSpotlight.name || '',
          score: winnerSpotlight.score || 0,
          whyChosen: winnerSpotlight.why_chosen || '',
          keyStrengths: winnerSpotlight.key_strengths || [],
        },
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

      // Store data and open modal for preview
      setReportData({ 
        presentationContent: transformedContent, 
        viableCandidates: transformedCandidates, 
        allRankings: result.rankings,
        comparisonMatrix: result.comparison_matrix,
        businessCaseAnalysis: result.business_case_analysis || [],
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
    <div className="space-y-8">
      {/* Export Button */}
      <div className="flex justify-end items-center pr-4 py-2 border-b border-muted/30 mb-4">
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
          {isGeneratingReport ? 'Generating...' : 'Executive Report (AI)'}
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
                  'flex items-center gap-5 p-5 rounded-xl transition-all',
                  ranking.rank === 1 
                    ? 'bg-[#B88F5E]/10 border-2 border-[#B88F5E]/30 shadow-sm' 
                    : 'bg-muted/40 border border-muted/60 hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-3 min-w-[80px]">
                  {getRankIcon(ranking.rank)}
                  <span className="text-xl font-bold text-foreground/80">#{ranking.rank}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base tracking-tight">{ranking.candidate_name}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{ranking.key_differentiator}</p>
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

      {/* Comparison Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-muted/60">
            <table className="w-full">
              <thead>
                <tr className="bg-[#100D0A] text-[#FDFAF0]">
                  <th className="text-left py-4 px-5 font-semibold text-sm tracking-wide">Criterion</th>
                  {result.rankings.map((r) => (
                    <th key={r.application_id} className="text-center py-4 px-4 font-semibold text-sm tracking-wide min-w-[180px]">
                      {r.candidate_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.comparison_matrix.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={cn(
                      "border-b border-muted/40 last:border-0 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <td className="py-4 px-5 font-medium text-sm">{row.criterion}</td>
                    {row.candidates.map((c) => (
                      <td key={c.application_id} className="text-center py-4 px-4">
                        <div className={cn(
                          'inline-flex items-center justify-center w-14 h-8 rounded-md font-bold text-sm',
                          c.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          c.score >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {c.score}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[200px] mx-auto">{c.notes}</p>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="grid gap-5 md:grid-cols-2">
            {result.risks.filter(r => r.risks.length > 0 || result.rankings.find(rank => rank.candidate_name === r.candidate_name)?.score > 0).map((risk) => {
              const candidateRank = result.rankings.find(rank => rank.candidate_name === risk.candidate_name);
              const isTopCandidate = candidateRank?.rank === 1;
              
              return (
                <div 
                  key={risk.application_id} 
                  className={cn(
                    "rounded-xl p-6 border transition-all",
                    isTopCandidate 
                      ? "bg-[#B88F5E]/5 border-[#B88F5E]/30" 
                      : "bg-muted/30 border-muted/50 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                      isTopCandidate 
                        ? "bg-[#B88F5E]/20 text-[#B88F5E]" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      #{candidateRank?.rank || '-'}
                    </div>
                    <div>
                      <p className="font-semibold tracking-tight">{risk.candidate_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {risk.risks.length === 0 ? 'Low risk profile' : `${risk.risks.length} risk${risk.risks.length > 1 ? 's' : ''} identified`}
                      </p>
                    </div>
                  </div>
                  
                  {risk.risks.length > 0 ? (
                    <ul className="space-y-2">
                      {risk.risks.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <span className="text-muted-foreground leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
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
                {/* Question Header */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg">
                    Question {qIdx + 1}: {question.question_title}
                  </h4>
                  {question.question_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {question.question_description}
                    </p>
                  )}
                </div>

                {/* Candidate Responses Grid */}
                <div className="grid gap-5 md:grid-cols-2">
                  {question.candidate_responses.map((resp) => (
                    <div 
                      key={resp.application_id} 
                      className={cn(
                        "border rounded-xl p-5 transition-all",
                        resp.candidate_name === question.best_response 
                          ? "border-[#B88F5E] bg-[#B88F5E]/5 shadow-sm" 
                          : "border-muted/60 hover:border-muted"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm tracking-tight flex items-center gap-2">
                          {resp.candidate_name}
                          {resp.candidate_name === question.best_response && (
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
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-6 leading-relaxed">
                        {resp.response_summary || 'No response provided'}
                      </p>
                      <p className="text-xs italic text-[#93B1FF] leading-relaxed">
                        {resp.assessment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Comparative Analysis */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-medium">AI Comparative Analysis</span>
                    <Badge variant="outline" className="ml-auto">
                      Best: {question.best_response}
                    </Badge>
                  </div>
                  <p className="text-sm">{question.comparative_analysis}</p>
                </div>

                {qIdx < (result.business_case_analysis?.length || 0) - 1 && <Separator />}
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
        confidence={reportData?.confidence || 'medium'}
        jobTitle={jobTitle}
      />
    </div>
  );
}
