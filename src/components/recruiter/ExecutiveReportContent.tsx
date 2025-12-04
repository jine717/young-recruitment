import { cn } from '@/lib/utils';

export interface ViableCandidate {
  name: string;
  score: number;
  strengths: string[];
  keyDifferentiator: string;
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
  confidence: 'high' | 'medium' | 'low';
  jobTitle: string;
}

export function ExecutiveReportContent({
  presentationContent,
  viableCandidates,
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
  const maxScore = Math.max(...safeCandidates.map(c => c.score), 1);

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
      <div className="page-1 min-h-[297mm] p-10 flex flex-col print:break-after-page">
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
            <p className="font-bold text-lg mt-1">{safeCandidates.length} evaluated</p>
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
      <div className="page-2 min-h-[297mm] p-10 flex flex-col print:break-after-page">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-8 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Candidate Comparison Report</span>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">★</span>
          <h3 className="text-2xl font-bold uppercase tracking-wide text-[#B88F5E]">Our Recommendation</h3>
        </div>

        {/* Winner Box */}
        <div className="border-4 border-[#B88F5E] p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-3xl font-black">{topCandidate.name}</h4>
            <div className="bg-[#93B1FF] w-20 h-20 flex items-center justify-center">
              <span className="text-3xl font-black">{topCandidate.score}</span>
            </div>
          </div>
          
          <p className="italic text-lg mb-6 text-[#605738]">
            "{topCandidate.whyChosen}"
          </p>

          <ul className="space-y-2">
            {(topCandidate.keyStrengths ?? []).slice(0, 4).map((strength, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[#100D0A] rounded-full" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why Section */}
        <div className="mb-8">
          <h4 className="text-lg font-bold uppercase tracking-wide mb-3">Why {topCandidate.name}?</h4>
          <p className="text-[#605738] leading-relaxed">
            {topCandidate.whyChosen}
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-[#100D0A] my-6" />

        {/* Candidate Overview */}
        <div className="flex-1">
          <h4 className="text-lg font-bold uppercase tracking-wide mb-6">Candidate Overview</h4>
          
          <div className="space-y-4">
            {safeCandidates.slice(0, 5).map((candidate, idx) => {
              const isWinner = candidate.name === topCandidate.name;
              const barWidth = (candidate.score / maxScore) * 100;
              
              return (
                <div key={idx} className="flex items-center gap-4">
                  <span className={cn(
                    "w-24 font-semibold truncate",
                    isWinner && "font-black"
                  )}>
                    {candidate.name}
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
                    "w-12 text-right font-bold",
                    isWinner && "text-[#93B1FF]"
                  )}>
                    {candidate.score}
                  </span>
                </div>
              );
            })}
          </div>

          {safeCandidates.length === 0 && (
            <p className="italic text-[#605738] mt-4">
              Limited candidates met evaluation criteria
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between text-xs text-[#605738] mt-auto pt-6 border-t border-[#100D0A]/20">
          <span>Page 2 of 3</span>
          <span className="uppercase tracking-wider">Confidential</span>
        </div>
      </div>

      {/* ========== PAGE 3: Key Insights + Next Steps ========== */}
      <div className="page-3 min-h-[297mm] p-10 flex flex-col">
        {/* Header Bar */}
        <div className="bg-[#93B1FF] -mx-10 -mt-10 px-10 py-4 mb-8 flex items-center justify-between">
          <span className="font-black text-xl">YOUNG.</span>
          <span className="text-sm">Candidate Comparison Report</span>
        </div>

        {/* Key Insights */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold uppercase tracking-wide mb-4">Key Insights</h3>
          
          <div className="bg-[#FDFAF0] border border-[#100D0A]/10 p-6 shadow-sm">
            <ul className="space-y-4">
              {(presentationContent?.keyInsights ?? []).slice(0, 4).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-[#93B1FF] font-bold">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Considerations */}
        <div className="mb-8">
          <h3 className="text-xl font-bold uppercase tracking-wide mb-4 text-[#B88F5E]">
            Considerations for Final Interview
          </h3>
          
          <div className="border-2 border-[#B88F5E] p-6">
            <ul className="space-y-3">
              {(presentationContent?.considerations ?? []).slice(0, 4).map((consideration, idx) => (
                <li key={idx} className="flex items-start gap-3">
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
          <h3 className="text-2xl font-bold uppercase tracking-wide mb-4">Recommended Next Steps</h3>
          
          <div className="bg-[#93B1FF] p-8">
            <ul className="space-y-4 mb-6">
              {(presentationContent?.nextSteps ?? []).slice(0, 4).map((step, idx) => (
                <li key={idx} className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-[#100D0A] text-[#FDFAF0] rounded-full flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#100D0A]/30 pt-4 mt-6">
              <p className="text-sm uppercase tracking-wider mb-1">Timeline</p>
              <p className="text-2xl font-black">{presentationContent?.timeline || '5-7 Business Days'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#100D0A] text-[#FDFAF0] -mx-10 -mb-10 px-10 py-4 mt-8 flex justify-between text-xs uppercase tracking-wider">
          <span>Page 3 of 3</span>
          <span>Confidential · Young Recruitment</span>
        </div>
      </div>
    </div>
  );
}
