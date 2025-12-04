import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal, Award, AlertTriangle, CheckCircle, Target, Download, FileText, Loader2, FileQuestion, Brain } from 'lucide-react';
import type { ComparisonResult } from '@/hooks/useCandidateComparison';
import { cn } from '@/lib/utils';
import { exportComparisonToPdf } from '@/utils/exportComparisonPdf';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import type { PresentationContent, ViableCandidate, CandidateRanking, ComparisonMatrixItem } from './ExecutiveReportContent';

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

  const handleExportPdf = () => {
    exportComparisonToPdf({ result, jobTitle });
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
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleExportPdf} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report
        </Button>
        <Button onClick={handleExportExecutiveReport} disabled={isGeneratingReport}>
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
          <div className="space-y-4">
            {result.rankings.map((ranking) => (
              <div
                key={ranking.application_id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg',
                  ranking.rank === 1 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                )}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(ranking.rank)}
                  <span className="text-2xl font-bold">#{ranking.rank}</span>
                </div>

                <div className="flex-1">
                  <p className="font-semibold">{ranking.candidate_name}</p>
                  <p className="text-sm text-muted-foreground">{ranking.key_differentiator}</p>
                </div>

                <div className={cn('text-2xl font-bold', getScoreColor(ranking.score))}>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Criterion</th>
                  {result.rankings.map((r) => (
                    <th key={r.application_id} className="text-center py-3 px-2 font-medium">
                      {r.candidate_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.comparison_matrix.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 px-2 font-medium">{row.criterion}</td>
                    {row.candidates.map((c) => (
                      <td key={c.application_id} className="text-center py-3 px-2">
                        <div className={cn('font-bold', getScoreColor(c.score))}>
                          {c.score}/100
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>
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
          <div className="grid gap-4 md:grid-cols-2">
            {result.risks.filter(r => r.risks.length > 0 || result.rankings.find(rank => rank.candidate_name === r.candidate_name)?.score > 0).map((risk) => (
              <div key={risk.application_id} className="p-4 rounded-lg bg-muted/50">
                <p className="font-semibold mb-2">{risk.candidate_name}</p>
                {risk.risks.length > 0 ? (
                  <ul className="space-y-1">
                    {risk.risks.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No significant risks identified</p>
                )}
              </div>
            ))}
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {question.candidate_responses.map((resp) => (
                    <div 
                      key={resp.application_id} 
                      className={cn(
                        "border rounded-lg p-4",
                        resp.candidate_name === question.best_response && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold flex items-center gap-2">
                          {resp.candidate_name}
                          {resp.candidate_name === question.best_response && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </span>
                        <Badge className={cn(
                          resp.score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          resp.score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {resp.score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-4">
                        {resp.response_summary || 'No response provided'}
                      </p>
                      <p className="text-xs italic text-primary/80">
                        {resp.assessment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Comparative Analysis */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
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
        confidence={reportData?.confidence || 'medium'}
        jobTitle={jobTitle}
      />
    </div>
  );
}
