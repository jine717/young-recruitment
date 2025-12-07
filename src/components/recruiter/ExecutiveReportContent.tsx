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
  alternativeOption?: {
    name: string;
    score: number;
    justification: string;
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

  // Calculate total pages: Cover+Recommendation(1) + Interview(optional) + Business Case (1 per question) + Matrix + Insights
  const businessCasePages = safeBusinessCase.length;
  const totalPages = 1 + interviewPages + businessCasePages + 1 + 1;

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
      {/* ========== PAGE 1: Cover + Executive Summary + Recommendation + Overview ========== */}
      <div className="page-1 min-h-[297mm] max-h-[297mm] p-8 flex flex-col overflow-hidden">
        {/* Header with Young Blue accent */}
        <div className="bg-[#93B1FF] -mx-8 -mt-8 px-8 py-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">YOUNG.</h1>
              <p className="text-xs mt-0.5 tracking-widest uppercase opacity-80">Unite to Disrupt</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">{jobTitle}</p>
              <p className="opacity-80">{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary - Compact */}
        <div className="mb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Executive Summary</h2>
          <blockquote className="text-sm italic leading-relaxed border-l-4 border-[#93B1FF] pl-4 py-2 bg-white/50">
            "{presentationContent?.executiveSummary || 'Candidate evaluation in progress.'}"
          </blockquote>
        </div>

        {/* Metric Cards Row - Compact */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#B88F5E] text-white p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest mb-1 opacity-80">Top Pick</p>
            <p className="text-base font-bold truncate">{topCandidate.name}</p>
          </div>
          <div className="bg-[#93B1FF] p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest mb-1 opacity-80">Score</p>
            <p className="text-2xl font-black">{topCandidate.score}</p>
          </div>
          <div className="bg-[#605738] text-white p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest mb-1 opacity-80">Confidence</p>
            <p className="text-base font-bold">{getConfidenceLabel(confidence)}</p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-[#100D0A]/20 my-3" />

        {/* AI Recommendation Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl text-green-600">✓</span>
            <h3 className="text-lg font-bold uppercase tracking-wide text-[#93B1FF]">AI Recommendation</h3>
            {/* Confidence Badge */}
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full ml-auto",
              confidence === 'high' ? "bg-green-100 text-green-800" :
              confidence === 'medium' ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            )}>
              {getConfidenceLabel(confidence)} Confidence
            </span>
          </div>

          {/* Top Choice Box - Gold border */}
          <div className="border-2 border-[#B88F5E] p-4 mb-3">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-2xl">🏆</span>
              <div className="flex-1">
                <h4 className="text-xl font-black">{topCandidate.name}</h4>
              </div>
              <div className="bg-[#93B1FF] w-12 h-12 flex items-center justify-center shrink-0">
                <span className="text-xl font-black">{topCandidate.score}</span>
              </div>
            </div>
            
            <h5 className="font-semibold text-sm mb-1">Why this candidate?</h5>
            <p className="text-sm text-[#605738] leading-relaxed mb-3">
              {topCandidate.whyChosen}
            </p>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {(topCandidate.keyStrengths ?? []).slice(0, 4).map((strength, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-[#100D0A] rounded-full shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative Option - If exists */}
          {presentationContent?.alternativeOption && (
            <div className="border border-[#605738]/30 p-4 bg-[#605738]/5">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-sm text-[#605738]">
                  Alternative Option: {presentationContent.alternativeOption.name}
                </h5>
                <span className="text-sm font-bold text-[#605738]">
                  {presentationContent.alternativeOption.score}/100
                </span>
              </div>
              <p className="text-sm text-[#605738] leading-relaxed">
                {presentationContent.alternativeOption.justification}
              </p>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-[#100D0A]/20 my-3" />

        {/* Candidate Overview - Bar Chart */}
        <div className="flex-1">
          <h4 className="text-base font-bold uppercase tracking-wide mb-3">Candidate Overview</h4>
          
          <div className="space-y-3">
            {safeRankings.slice(0, MAX_CANDIDATES_OVERVIEW).map((ranking) => {
              const isWinner = ranking.candidate_name === topCandidate.name;
              const maxRankingScore = Math.max(...safeRankings.map(r => r.score), 1);
              const barWidth = (ranking.score / maxRankingScore) * 100;
              
              return (
                <div key={ranking.application_id} className="flex items-center gap-3">
                  <span className={cn(
                    "w-32 text-sm font-medium truncate",
                    isWinner && "font-bold text-[#B88F5E]"
                  )}>
                    {ranking.candidate_name}
                  </span>
                  <div className="flex-1 h-6 bg-white border border-[#100D0A]/20 relative">
                    <div
                      className={cn(
                        "h-full transition-all",
                        isWinner ? "bg-[#93B1FF]" : "bg-[#605738]"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={cn(
                    "w-10 text-right font-bold",
                    isWinner && "text-[#93B1FF]"
                  )}>
                    {ranking.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#100D0A] text-[#FDFAF0] -mx-8 -mb-8 px-8 py-3 mt-auto flex justify-between text-xs uppercase tracking-wider">
          <span>Page 1 of {totalPages}</span>
          <span>Confidential · Young Recruitment</span>
        </div>
      </div>

      {/* ========== PAGE 2 (OPTIONAL): Interview Performance Comparison ========== */}
      {hasInterviewData && (
        <div className="page-interview min-h-[297mm] max-h-[297mm] p-8 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#93B1FF] -mx-8 -mt-8 px-8 py-4 mb-5 flex items-center justify-between">
            <span className="font-black text-xl">YOUNG.</span>
            <span className="text-sm">Interview Performance Analysis</span>
          </div>

          {/* Section Title */}
          <h3 className="text-xl font-bold uppercase tracking-wide mb-4">Interview Performance Comparison</h3>

          {/* 3-Column Flexbox Layout (Inline Styles for Reliable Rendering) */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '12px',
              flex: '1 1 0%'
            }}
          >
            {safeInterviewPerformance.filter(ip => ip.has_interview).slice(0, 3).map((perf, idx) => {
              const isTopCandidate = perf.candidate_name === topCandidate.name;
              const trajectory = perf.score_trajectory;
              
              return (
                <div 
                  key={perf.application_id}
                  style={{
                    flex: '1 1 0%',
                    minWidth: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `2px solid ${isTopCandidate ? '#B88F5E' : 'rgba(16,13,10,0.2)'}`,
                    backgroundColor: isTopCandidate ? 'rgba(184,143,94,0.05)' : 'white',
                    padding: '12px',
                  }}
                >
                  {/* Header: Rank + Name + Score */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: isTopCandidate ? 'rgba(184,143,94,0.2)' : 'rgba(16,13,10,0.1)',
                        color: isTopCandidate ? '#B88F5E' : '#100D0A',
                      }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{perf.candidate_name}</span>
                    </div>
                    <span style={{ 
                      fontSize: '22px', 
                      fontWeight: '900',
                      color: isTopCandidate ? '#B88F5E' : '#100D0A'
                    }}>
                      {trajectory?.final_score || perf.interview_score}
                    </span>
                  </div>

                  {/* Performance Badge */}
                  {perf.application_vs_interview && (
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: '500',
                        borderRadius: '9999px',
                        backgroundColor: perf.application_vs_interview.toLowerCase().includes('exceeded') 
                          ? '#dcfce7' : perf.application_vs_interview.toLowerCase().includes('below')
                          ? '#fecaca' : 'rgba(147,177,255,0.2)',
                        color: perf.application_vs_interview.toLowerCase().includes('exceeded')
                          ? '#166534' : perf.application_vs_interview.toLowerCase().includes('below')
                          ? '#991b1b' : '#100D0A',
                      }}>
                        {perf.application_vs_interview.includes('Exceeded') ? '↗' : 
                         perf.application_vs_interview.includes('Below') ? '↘' : '−'} {perf.application_vs_interview}
                      </span>
                    </div>
                  )}

                  {/* Score Change Box */}
                  {trajectory && (
                    <div style={{ 
                      backgroundColor: '#FDFAF0', 
                      border: '1px solid rgba(16,13,10,0.1)', 
                      padding: '10px', 
                      marginBottom: '10px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#605738' }}>
                          {trajectory.initial_score} → <strong style={{ color: '#93B1FF' }}>{trajectory.final_score}</strong>
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          color: trajectory.change > 0 ? '#15803d' : trajectory.change < 0 ? '#b91c1c' : '#605738'
                        }}>
                          {trajectory.change > 0 ? '↗ +' : trajectory.change < 0 ? '↘ ' : '− '}{trajectory.change}
                        </span>
                      </div>
                      {trajectory.explanation && (
                        <p style={{ fontSize: '10px', color: '#605738', margin: 0, lineHeight: '1.3' }}>
                          {trajectory.explanation.length > 80 ? trajectory.explanation.slice(0, 80) + '...' : trajectory.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Strengths - Max 3 items */}
                  {perf.strengths_demonstrated && perf.strengths_demonstrated.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#605738', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#16a34a' }}>✓</span> Strengths
                      </p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {perf.strengths_demonstrated.slice(0, 3).map((str, i) => (
                          <li key={i} style={{ fontSize: '11px', marginBottom: '2px', display: 'flex', gap: '6px', lineHeight: '1.3' }}>
                            <span style={{ color: '#16a34a', flexShrink: 0 }}>•</span>
                            <span>{str.length > 50 ? str.slice(0, 50) + '...' : str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns - Max 2 items */}
                  {perf.concerns_raised && perf.concerns_raised.length > 0 && (
                    <div style={{ marginTop: 'auto' }}>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#605738', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#B88F5E' }}>⚠</span> Concerns
                      </p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {perf.concerns_raised.slice(0, 2).map((concern, i) => (
                          <li key={i} style={{ fontSize: '11px', marginBottom: '2px', display: 'flex', gap: '6px', lineHeight: '1.3' }}>
                            <span style={{ color: '#B88F5E', flexShrink: 0 }}>•</span>
                            <span>{concern.length > 50 ? concern.slice(0, 50) + '...' : concern}</span>
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
              <p className="text-sm text-[#605738]">
                <strong>Not yet interviewed:</strong>{' '}
                {safeInterviewPerformance.filter(ip => !ip.has_interview).map(ip => ip.candidate_name).join(', ')}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-[#100D0A] text-[#FDFAF0] -mx-8 -mb-8 px-8 py-3 mt-auto flex justify-between text-xs uppercase tracking-wider">
            <span>Page 2 of {totalPages}</span>
            <span>Confidential · Young Recruitment</span>
          </div>
        </div>
      )}

      {/* ========== BUSINESS CASE PAGES: Analysis (1 question per page) ========== */}
      {safeBusinessCase.length > 0 && (
        <>
          {safeBusinessCase.map((question, questionIdx) => {
            const currentPageNum = 2 + interviewPages + questionIdx;
            
            return (
              <div 
                key={questionIdx} 
                className="page-business-case min-h-[297mm] max-h-[297mm] p-8 flex flex-col overflow-hidden"
              >
                {/* Header Bar */}
                <div className="bg-[#93B1FF] -mx-8 -mt-8 px-8 py-4 mb-5 flex items-center justify-between">
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
                  {/* Question Header */}
                  <div className="bg-[#100D0A] text-[#FDFAF0] p-4 mb-4">
                    <h4 className="font-bold text-lg">
                      Q{questionIdx + 1}: {question.question_title}
                    </h4>
                    {question.question_description && (
                      <p className="text-sm opacity-80 mt-2 leading-relaxed">
                        {question.question_description}
                      </p>
                    )}
                  </div>

                  {/* Candidate Responses */}
                  <div className="space-y-3 mb-4">
                    {question.candidate_responses.slice(0, MAX_CANDIDATES_BUSINESS_CASE).map((resp) => {
                      const isBest = resp.candidate_name === question.best_response;
                      return (
                        <div 
                          key={resp.application_id}
                          className={cn(
                            "p-4 border",
                            isBest 
                              ? "border-[#B88F5E] bg-[#B88F5E]/10" 
                              : "border-[#100D0A]/20 bg-white"
                          )}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={cn(
                              "font-semibold",
                              isBest && "text-[#B88F5E]"
                            )}>
                              {resp.candidate_name}
                              {isBest && <span className="ml-1">★</span>}
                            </span>
                            <span className={cn(
                              "font-bold shrink-0",
                              resp.score >= 80 ? "text-green-700" :
                              resp.score >= 60 ? "text-[#B88F5E]" : "text-red-700"
                            )}>
                              {resp.score}/100
                            </span>
                          </div>
                          <p className="text-sm text-[#605738] mb-2 leading-relaxed">
                            <span className="font-semibold text-[#100D0A]">Response:</span> {resp.response_summary || 'No response'}
                          </p>
                          <p className="text-sm italic text-[#100D0A]/70 leading-relaxed">
                            <span className="font-semibold not-italic">Assessment:</span> {resp.assessment}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Comparative Analysis */}
                  <div className="bg-[#93B1FF]/20 border border-[#93B1FF] p-4 mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm uppercase tracking-wider">AI Analysis</span>
                      <span className="ml-auto text-sm font-semibold text-[#B88F5E]">
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
      <div className="page-matrix min-h-[297mm] max-h-[297mm] p-8 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-8 -mt-8 px-8 py-4 mb-5 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Detailed Candidate Comparison</span>
        </div>

        {/* Section Title */}
        <h3 className="text-xl font-bold uppercase tracking-wide mb-4">Comparison Matrix</h3>

        {/* Comparison Matrix Table */}
        <div className="flex-1 overflow-hidden">
          {safeMatrix.length > 0 ? (
            <table className="w-full border-collapse text-sm">
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

        {/* Overall Scores Summary */}
        {safeRankings.length > 0 && (
          <div className="mt-5 pt-5 border-t-2 border-[#100D0A]">
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
          <span>Page {2 + interviewPages + businessCasePages} of {totalPages}</span>
          <span className="uppercase tracking-wider">Confidential</span>
        </div>
      </div>

      {/* ========== LAST PAGE: Key Insights + Next Steps ========== */}
      <div className="page-insights min-h-[297mm] max-h-[297mm] p-8 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-8 -mt-8 px-8 py-4 mb-5 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Candidate Comparison Report</span>
        </div>

        {/* Key Insights */}
        <div className="mb-5">
          <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Key Insights</h3>
          
          <div className="bg-white border border-[#100D0A]/10 p-5">
            <ul className="space-y-3">
              {(presentationContent?.keyInsights ?? []).slice(0, 5).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-[#93B1FF] font-bold shrink-0">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Considerations */}
        <div className="mb-5">
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
        <div className="flex-1">
          <h3 className="text-xl font-bold uppercase tracking-wide mb-3">Recommended Next Steps</h3>
          
          <div className="bg-[#93B1FF] p-5">
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
        <div className="bg-[#100D0A] text-[#FDFAF0] -mx-8 -mb-8 px-8 py-3 mt-5 flex justify-between text-xs uppercase tracking-wider">
          <span>Page {totalPages} of {totalPages}</span>
          <span>Confidential · Young Recruitment</span>
        </div>
      </div>
    </div>
  );
}
