import { cn } from '@/lib/utils';

export interface ViableCandidate {
  name: string;
  score: number;
  strengths: string[];
  keyDifferentiator: string;
}

export interface CandidateRanking {
  application_id: string;
  candidate_name: string;
  rank: number;
  score: number;
  key_differentiator: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface ComparisonMatrixItem {
  criterion: string;
  candidates: {
    application_id: string;
    candidate_name?: string;
    score: number;
    notes: string;
  }[];
}

export interface BusinessCaseResponseAnalysis {
  application_id: string;
  candidate_name: string;
  response_summary: string;
  score: number;
  assessment: string;
}

export interface BusinessCaseAnalysisItem {
  question_title: string;
  question_description?: string;
  candidate_responses: BusinessCaseResponseAnalysis[];
  comparative_analysis: string;
  best_response: string;
}

export interface InterviewPerformanceItem {
  application_id: string;
  candidate_name: string;
  has_interview: boolean;
  interview_score?: number;
  application_vs_interview?: string;
  score_trajectory?: {
    initial_score: number;
    final_score: number;
    change: number;
    explanation: string;
  };
  strengths_demonstrated?: string[];
  concerns_raised?: string[];
}

export interface PresentationContent {
  executiveSummary: string;
  topRecommendation: {
    name: string;
    score: number;
    whyChosen: string;
    keyStrengths: string[];
  };
  keyInsights: string[];
  considerations: string[];
  nextSteps: string[];
  timeline: string;
}

interface ExecutiveReportContentProps {
  presentationContent: PresentationContent;
  viableCandidates: ViableCandidate[];
  allRankings: CandidateRanking[];
  comparisonMatrix: ComparisonMatrixItem[];
  businessCaseAnalysis: BusinessCaseAnalysisItem[];
  interviewPerformance: InterviewPerformanceItem[];
  confidence: 'high' | 'medium' | 'low';
  jobTitle: string;
}

// Constants for limits - optimized for 3 candidates max
const MAX_CANDIDATES_OVERVIEW = 3;
const MAX_CANDIDATES_BUSINESS_CASE = 3;
const MAX_CANDIDATES_MATRIX = 3;
const MAX_CANDIDATES_SCORES = 3;

export function ExecutiveReportContent({
  presentationContent,
  viableCandidates,
  allRankings,
  comparisonMatrix,
  businessCaseAnalysis,
  interviewPerformance,
  confidence,
  jobTitle,
}: ExecutiveReportContentProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Safe defaults for topRecommendation
  const topCandidate = presentationContent?.topRecommendation ?? {
    name: 'No Recommendation',
    score: 0,
    whyChosen: 'No candidates available for evaluation.',
    keyStrengths: [],
  };
  
  const safeCandidates = viableCandidates ?? [];
  const safeRankings = allRankings ?? [];
  const safeMatrix = comparisonMatrix ?? [];
  const safeBusinessCase = businessCaseAnalysis ?? [];
  const safeInterviewPerformance = interviewPerformance ?? [];

  // Check if there's interview data to display
  const hasInterviewData = safeInterviewPerformance.some(ip => ip.has_interview);
  const interviewPages = hasInterviewData ? 1 : 0;

  // Calculate total pages: Cover(1) + Recommendation(2) + Interview(optional) + Business Case (1 per question) + Matrix + Insights
  const businessCasePages = safeBusinessCase.length;
  const totalPages = 2 + interviewPages + businessCasePages + 1 + 1;

  const getConfidenceLabel = (conf: string) => {
    switch (conf) {
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      default: return conf.toUpperCase();
    }
  };

  return (
    <div className="executive-report-container bg-[#FDFAF0] text-[#100D0A] font-sans">
      {/* ========== PAGE 1: Cover + Executive Summary ========== */}
      <div className="page-1 min-h-[297mm] max-h-[297mm] p-10 flex flex-col overflow-hidden">
        {/* Header with Young Blue accent */}
        <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-8 mb-8">
          <h1 className="text-5xl font-black tracking-tight">YOUNG.</h1>
          <p className="text-sm mt-1 tracking-widest uppercase opacity-80">Unite to Disrupt</p>
        </div>

        {/* Main Title */}
        <div className="text-center my-8">
          <h2 className="text-3xl font-bold uppercase tracking-wide mb-2">Executive Summary</h2>
          <p className="text-lg text-[#605738]">Candidate Comparison Report</p>
        </div>

        {/* Position & Date */}
        <div className="flex justify-center gap-12 my-6 text-sm">
          <div>
            <span className="text-[#605738] uppercase tracking-wider">Position</span>
            <p className="font-bold text-lg mt-1">{jobTitle}</p>
          </div>
          <div>
            <span className="text-[#605738] uppercase tracking-wider">Date</span>
            <p className="font-bold text-lg mt-1">{currentDate}</p>
          </div>
          <div>
            <span className="text-[#605738] uppercase tracking-wider">Candidates</span>
            <p className="font-bold text-lg mt-1">{safeRankings.length} evaluated</p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t-2 border-[#100D0A] my-8" />

        {/* Executive Summary Quote */}
        <div className="flex-1 flex items-center justify-center px-8">
          <blockquote className="text-xl italic leading-relaxed text-center max-w-3xl">
            "{presentationContent?.executiveSummary || 'Candidate evaluation in progress.'}"
          </blockquote>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-6 mt-8 mb-4">
          {/* Top Pick - Gold */}
          <div className="bg-[#B88F5E] text-white p-6 text-center">
            <p className="text-xs uppercase tracking-widest mb-2 opacity-80">Top Pick</p>
            <p className="text-2xl font-bold">{topCandidate.name}</p>
          </div>
          {/* Score - Young Blue */}
          <div className="bg-[#93B1FF] p-6 text-center">
            <p className="text-xs uppercase tracking-widest mb-2 opacity-80">Score</p>
            <p className="text-4xl font-black">{topCandidate.score}</p>
          </div>
          {/* Confidence - Khaki */}
          <div className="bg-[#605738] text-white p-6 text-center">
            <p className="text-xs uppercase tracking-widest mb-2 opacity-80">Confidence</p>
            <p className="text-2xl font-bold">{getConfidenceLabel(confidence)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#100D0A] text-[#FDFAF0] -mx-10 -mb-10 px-10 py-4 mt-auto flex justify-between text-xs uppercase tracking-wider">
          <span>Confidential</span>
          <span>Young Recruitment</span>
        </div>
      </div>

      {/* ========== PAGE 2: Top Recommendation + Comparison ========== */}
      <div className="page-2 min-h-[297mm] max-h-[297mm] p-10 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-6 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Candidate Comparison Report</span>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">★</span>
          <h3 className="text-2xl font-bold uppercase tracking-wide text-[#B88F5E]">Our Recommendation</h3>
        </div>

        {/* Winner Box - More compact */}
        <div className="border-4 border-[#B88F5E] p-6 mb-6 avoid-break">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-2xl font-black">{topCandidate.name}</h4>
            <div className="bg-[#93B1FF] w-16 h-16 flex items-center justify-center">
              <span className="text-2xl font-black">{topCandidate.score}</span>
            </div>
          </div>
          
          <p className="italic text-sm mb-4 text-[#605738] line-clamp-2">
            "{topCandidate.whyChosen}"
          </p>

          <ul className="grid grid-cols-2 gap-2">
            {(topCandidate.keyStrengths ?? []).slice(0, 4).map((strength, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-[#100D0A] rounded-full shrink-0" />
                <span className="truncate">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Separator */}
        <div className="border-t border-[#100D0A] my-4" />

        {/* Candidate Overview - Optimized for 3 candidates */}
        <div className="flex-1 avoid-break">
          <h4 className="text-lg font-bold uppercase tracking-wide mb-4">Candidate Overview</h4>
          
          <div className="space-y-4">
            {safeRankings.slice(0, MAX_CANDIDATES_OVERVIEW).map((ranking) => {
              const isWinner = ranking.candidate_name === topCandidate.name;
              const maxRankingScore = Math.max(...safeRankings.map(r => r.score), 1);
              const barWidth = (ranking.score / maxRankingScore) * 100;
              
              return (
                <div key={ranking.application_id} className="flex items-center gap-4">
                  <span className={cn(
                    "w-36 text-sm font-semibold",
                    isWinner && "font-black text-[#B88F5E]"
                  )}>
                    {ranking.candidate_name}
                  </span>
                  <div className="flex-1 h-8 bg-[#FDFAF0] border border-[#100D0A]/20 relative">
                    <div
                      className={cn(
                        "h-full transition-all",
                        isWinner ? "bg-[#93B1FF]" : "bg-[#605738]"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={cn(
                    "w-14 text-right font-bold text-lg",
                    isWinner && "text-[#93B1FF]"
                  )}>
                    {ranking.score}
                  </span>
                </div>
              );
            })}
          </div>

          {safeRankings.length > MAX_CANDIDATES_OVERVIEW && (
            <p className="text-xs text-[#605738] mt-2 italic">
              +{safeRankings.length - MAX_CANDIDATES_OVERVIEW} more candidates
            </p>
          )}

          {safeRankings.length === 0 && (
            <p className="italic text-[#605738] mt-4">
              No candidates available for comparison
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between text-xs text-[#605738] mt-auto pt-4 border-t border-[#100D0A]/20">
          <span>Page 2 of {totalPages}</span>
          <span className="uppercase tracking-wider">Confidential</span>
        </div>
      </div>

      {/* ========== PAGE 3 (OPTIONAL): Interview Performance Comparison ========== */}
      {hasInterviewData && (
        <div className="page-interview min-h-[297mm] max-h-[297mm] p-10 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-6 flex items-center justify-between">
            <span className="font-black text-xl">YOUNG.</span>
            <span className="text-sm">Interview Performance Analysis</span>
          </div>

          {/* Section Title */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📊</span>
            <h3 className="text-2xl font-bold uppercase tracking-wide">Interview Performance</h3>
          </div>

          {/* Candidates with Interview Data - 3 column grid */}
          <div className="grid grid-cols-3 gap-4 flex-1">
            {safeInterviewPerformance.filter(ip => ip.has_interview).slice(0, 3).map((perf, idx) => {
              const isTopCandidate = perf.candidate_name === topCandidate.name;
              const trajectory = perf.score_trajectory;
              const changeColor = trajectory && trajectory.change > 0 ? 'text-green-700' : 
                                  trajectory && trajectory.change < 0 ? 'text-red-700' : 'text-[#605738]';
              
              return (
                <div 
                  key={perf.application_id}
                  className={cn(
                    "border-2 p-4 flex flex-col",
                    isTopCandidate ? "border-[#B88F5E] bg-[#B88F5E]/5" : "border-[#100D0A]/20"
                  )}
                >
                  {/* Candidate Name */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={cn(
                      "font-bold text-sm",
                      isTopCandidate && "text-[#B88F5E]"
                    )}>
                      {perf.candidate_name}
                      {isTopCandidate && <span className="ml-1">★</span>}
                    </h4>
                  </div>

                  {/* Score Trajectory */}
                  {trajectory && (
                    <div className="bg-[#93B1FF]/20 p-3 mb-3">
                      <p className="text-xs uppercase tracking-wider text-[#605738] mb-1">Score Trajectory</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{trajectory.initial_score}</span>
                        <span className="text-[#605738]">→</span>
                        <span className="text-2xl font-black text-[#93B1FF]">{trajectory.final_score}</span>
                        <span className={cn("text-sm font-bold", changeColor)}>
                          ({trajectory.change > 0 ? '+' : ''}{trajectory.change})
                        </span>
                      </div>
                      <p className="text-xs text-[#605738] mt-2 leading-relaxed line-clamp-2">
                        {trajectory.explanation}
                      </p>
                    </div>
                  )}

                  {/* Interview Score */}
                  {perf.interview_score !== undefined && (
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wider text-[#605738] mb-1">Interview Score</p>
                      <p className="text-xl font-bold">{perf.interview_score}/100</p>
                    </div>
                  )}

                  {/* Application vs Interview */}
                  {perf.application_vs_interview && (
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wider text-[#605738] mb-1">Performance Comparison</p>
                      <p className="text-xs leading-relaxed">{perf.application_vs_interview}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {perf.strengths_demonstrated && perf.strengths_demonstrated.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wider text-[#605738] mb-1">Strengths Demonstrated</p>
                      <ul className="space-y-1">
                        {perf.strengths_demonstrated.slice(0, 3).map((str, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs">
                            <span className="text-green-600">✓</span>
                            <span className="line-clamp-1">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {perf.concerns_raised && perf.concerns_raised.length > 0 && (
                    <div className="mt-auto">
                      <p className="text-xs uppercase tracking-wider text-[#605738] mb-1">Areas to Explore</p>
                      <ul className="space-y-1">
                        {perf.concerns_raised.slice(0, 2).map((concern, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs">
                            <span className="text-[#B88F5E]">!</span>
                            <span className="line-clamp-1">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Candidates without interview */}
          {safeInterviewPerformance.filter(ip => !ip.has_interview).length > 0 && (
            <div className="mt-4 p-3 bg-[#605738]/10 border border-[#605738]/20">
              <p className="text-xs text-[#605738]">
                <strong>Not yet interviewed:</strong>{' '}
                {safeInterviewPerformance.filter(ip => !ip.has_interview).map(ip => ip.candidate_name).join(', ')}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between text-xs text-[#605738] mt-4 pt-4 border-t border-[#100D0A]/20">
            <span>Page 3 of {totalPages}</span>
            <span className="uppercase tracking-wider">Confidential</span>
          </div>
        </div>
      )}

      {/* ========== BUSINESS CASE PAGES: Analysis (1 question per page) ========== */}
      {safeBusinessCase.length > 0 && (
        <>
          {safeBusinessCase.map((question, questionIdx) => {
            const currentPageNum = 3 + interviewPages + questionIdx;
            
            return (
              <div 
                key={questionIdx} 
                className="page-business-case min-h-[297mm] max-h-[297mm] p-10 flex flex-col overflow-hidden"
              >
                {/* Header Bar */}
                <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-6 flex items-center justify-between">
                  <span className="font-black text-xl">YOUNG.</span>
                  <span className="text-sm">Business Case Analysis</span>
                </div>

                {/* Section Title - only on first business case page */}
                {questionIdx === 0 && (
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-4">
                    Business Case Responses
                  </h3>
                )}

                {/* Single Question - Full content */}
                <div className="flex-1 flex flex-col">
                  {/* Question Header - Full description */}
                  <div className="bg-[#100D0A] text-[#FDFAF0] p-4 mb-4 avoid-break">
                    <h4 className="font-bold text-lg">
                      Q{questionIdx + 1}: {question.question_title}
                    </h4>
                    {question.question_description && (
                      <p className="text-sm opacity-80 mt-2 leading-relaxed">
                        {question.question_description}
                      </p>
                    )}
                  </div>

                  {/* Candidate Responses - Full content, vertical layout for more space */}
                  <div className="space-y-3 mb-4">
                    {question.candidate_responses.slice(0, MAX_CANDIDATES_BUSINESS_CASE).map((resp) => {
                      const isBest = resp.candidate_name === question.best_response;
                      return (
                        <div 
                          key={resp.application_id}
                          className={cn(
                            "p-3 border",
                            isBest 
                              ? "border-[#B88F5E] bg-[#B88F5E]/10" 
                              : "border-[#100D0A]/20"
                          )}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={cn(
                              "font-semibold text-sm",
                              isBest && "text-[#B88F5E]"
                            )}>
                              {resp.candidate_name}
                              {isBest && <span className="ml-1">★</span>}
                            </span>
                            <span className={cn(
                              "font-bold text-sm shrink-0",
                              resp.score >= 80 ? "text-green-700" :
                              resp.score >= 60 ? "text-[#B88F5E]" : "text-red-700"
                            )}>
                              {resp.score}/100
                            </span>
                          </div>
                          <p className="text-xs text-[#605738] mb-2 leading-relaxed">
                            <span className="font-semibold">Response:</span> {resp.response_summary || 'No response'}
                          </p>
                          <p className="text-xs italic text-[#100D0A]/70 leading-relaxed">
                            <span className="font-semibold not-italic">Assessment:</span> {resp.assessment}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {question.candidate_responses.length > MAX_CANDIDATES_BUSINESS_CASE && (
                    <p className="text-xs text-[#605738] mb-2 italic">
                      +{question.candidate_responses.length - MAX_CANDIDATES_BUSINESS_CASE} more responses
                    </p>
                  )}

                  {/* AI Comparative Analysis - Full text */}
                  <div className="bg-[#93B1FF]/20 border border-[#93B1FF] p-4 mt-auto avoid-break">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-xs uppercase tracking-wider">AI Analysis</span>
                      <span className="ml-auto text-xs font-semibold text-[#B88F5E]">
                        Best: {question.best_response}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{question.comparative_analysis}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between text-xs text-[#605738] mt-4 pt-4 border-t border-[#100D0A]/20">
                  <span>Page {currentPageNum} of {totalPages}</span>
                  <span className="uppercase tracking-wider">Confidential</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ========== COMPARISON MATRIX PAGE ========== */}
      <div className="page-matrix min-h-[297mm] max-h-[297mm] p-10 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-6 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Detailed Candidate Comparison</span>
        </div>

        {/* Section Title */}
        <h3 className="text-xl font-bold uppercase tracking-wide mb-4">Comparison Matrix</h3>

        {/* Comparison Matrix Table - Optimized for 3 candidates */}
        <div className="flex-1 overflow-hidden">
          {safeMatrix.length > 0 ? (
            <table className="w-full border-collapse text-sm avoid-break">
              <thead>
                <tr className="bg-[#100D0A] text-[#FDFAF0]">
                  <th className="p-3 text-left font-bold w-[25%]">Criterion</th>
                  {safeRankings.slice(0, MAX_CANDIDATES_MATRIX).map(r => (
                    <th key={r.application_id} className="p-3 text-center font-bold w-[25%]">
                      {r.candidate_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeMatrix.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FDFAF0]'}>
                    <td className="p-3 font-semibold border-b border-[#100D0A]/10">
                      {row.criterion}
                    </td>
                    {row.candidates.slice(0, MAX_CANDIDATES_MATRIX).map(c => (
                      <td key={c.application_id} className="p-3 text-center border-b border-[#100D0A]/10 align-top">
                        <span className={cn(
                          "font-bold text-lg",
                          c.score >= 80 ? "text-green-700" :
                          c.score >= 60 ? "text-[#B88F5E]" : "text-red-700"
                        )}>
                          {c.score}
                        </span>
                        {c.notes && (
                          <p className="text-xs text-[#605738] mt-2 text-left leading-relaxed">{c.notes}</p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="italic text-[#605738]">No comparison data available</p>
          )}
        </div>

        {/* Summary Row - Optimized for 3 candidates */}
        {safeRankings.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-[#100D0A] avoid-break">
            <h4 className="text-sm font-bold uppercase tracking-wide mb-4">Overall Scores</h4>
            <div className="grid grid-cols-3 gap-4">
              {safeRankings.slice(0, MAX_CANDIDATES_SCORES).map((r, idx) => (
                <div 
                  key={r.application_id} 
                  className={cn(
                    "p-4 text-center",
                    idx === 0 ? "bg-[#B88F5E] text-white" : "bg-[#605738]/10"
                  )}
                >
                  <p className={cn(
                    "text-sm font-semibold mb-2",
                    idx === 0 ? "text-white" : "text-[#100D0A]"
                  )}>
                    {r.candidate_name}
                  </p>
                  <p className={cn(
                    "text-3xl font-black",
                    idx === 0 ? "text-white" : "text-[#100D0A]"
                  )}>
                    {r.score}
                  </p>
                  <p className={cn(
                    "text-xs uppercase tracking-wider mt-2",
                    idx === 0 ? "text-white/80" : "text-[#605738]"
                  )}>
                    Rank #{r.rank}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between text-xs text-[#605738] mt-auto pt-4 border-t border-[#100D0A]/20">
          <span>Page {3 + interviewPages + businessCasePages} of {totalPages}</span>
          <span className="uppercase tracking-wider">Confidential</span>
        </div>
      </div>

      {/* ========== LAST PAGE: Key Insights + Next Steps ========== */}
      <div className="page-insights min-h-[297mm] max-h-[297mm] p-10 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-6 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Candidate Comparison Report</span>
        </div>

        {/* Key Insights */}
        <div className="mb-6 avoid-break">
          <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Key Insights</h3>
          
          <div className="bg-[#FDFAF0] border border-[#100D0A]/10 p-5 shadow-sm">
            <ul className="space-y-3">
              {(presentationContent?.keyInsights ?? []).slice(0, 4).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-[#93B1FF] font-bold">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Considerations */}
        <div className="mb-6 avoid-break">
          <h3 className="text-lg font-bold uppercase tracking-wide mb-3 text-[#B88F5E]">
            Considerations for Final Interview
          </h3>
          
          <div className="border-2 border-[#B88F5E] p-5">
            <ul className="space-y-2">
              {(presentationContent?.considerations ?? []).slice(0, 4).map((consideration, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 border border-[#100D0A] rounded-full flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <span>{consideration}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="flex-1 avoid-break">
          <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Recommended Next Steps</h3>
          
          <div className="bg-[#93B1FF] p-6">
            <ul className="space-y-3 mb-4">
              {(presentationContent?.nextSteps ?? []).slice(0, 4).map((step, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-[#100D0A] text-[#FDFAF0] rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm">{step}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#100D0A]/30 pt-4 mt-4">
              <p className="text-xs uppercase tracking-wider mb-1">Timeline</p>
              <p className="text-xl font-black">{presentationContent?.timeline || '5-7 Business Days'}</p>
            </div>
          </div>
        </div>

        {/* Final Footer */}
        <div className="bg-[#100D0A] text-[#FDFAF0] -mx-10 -mb-10 px-10 py-4 mt-6 flex justify-between text-xs uppercase tracking-wider">
          <span>Page {totalPages} of {totalPages}</span>
          <span>Confidential · Young Recruitment</span>
        </div>
      </div>
    </div>
  );
}
