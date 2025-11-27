import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Briefcase, GraduationCap, AlertTriangle, Star, User, MessageSquare, Target } from 'lucide-react';
import { useState } from 'react';
import type { CVAnalysis, DISCAnalysis, DocumentAnalysis } from '@/hooks/useDocumentAnalysis';

interface DocumentAnalysisCardProps {
  analysis: DocumentAnalysis;
}

const DISC_COLORS = {
  D: 'bg-red-100 text-red-800 border-red-300',
  I: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  S: 'bg-green-100 text-green-800 border-green-300',
  C: 'bg-blue-100 text-blue-800 border-blue-300',
};

const DISC_LABELS = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness',
};

export function DocumentAnalysisCard({ analysis }: DocumentAnalysisCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (analysis.status !== 'completed' || !analysis.analysis) {
    return null;
  }

  const isCVAnalysis = analysis.document_type === 'cv';
  const data = analysis.analysis as CVAnalysis | DISCAnalysis;

  return (
    <Card className="mt-4 border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                {isCVAnalysis ? '📄 CV Analysis' : '🎯 DISC Analysis'}
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {isCVAnalysis ? (
              <CVAnalysisContent data={data as CVAnalysis} />
            ) : (
              <DISCAnalysisContent data={data as DISCAnalysis} />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function CVAnalysisContent({ data }: { data: CVAnalysis }) {
  return (
    <>
      {/* Summary */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm">{data.candidate_summary}</p>
        <p className="text-xs text-muted-foreground mt-2">
          ~{data.experience_years} years of experience
        </p>
      </div>

      {/* Key Skills */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Star className="w-3 h-3" /> Key Skills
        </h4>
        <div className="flex flex-wrap gap-1">
          {data.key_skills.map((skill, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Work History */}
      {data.work_history.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Work History
          </h4>
          <div className="space-y-2">
            {data.work_history.slice(0, 3).map((job, i) => (
              <div key={i} className="text-xs p-2 bg-muted/30 rounded">
                <p className="font-medium">{job.role}</p>
                <p className="text-muted-foreground">{job.company} • {job.duration}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Education
          </h4>
          <div className="space-y-1">
            {data.education.map((edu, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium">{edu.degree}</span>
                <span className="text-muted-foreground"> - {edu.institution}</span>
                {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-600 mb-2">✓ Strengths</h4>
          <ul className="text-xs space-y-1">
            {data.strengths.map((strength, i) => (
              <li key={i} className="text-muted-foreground">• {strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Red Flags */}
      {data.red_flags.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Potential Concerns
          </h4>
          <ul className="text-xs space-y-1">
            {data.red_flags.map((flag, i) => (
              <li key={i} className="text-muted-foreground">• {flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Overall Impression */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
        <h4 className="text-xs font-semibold mb-1">Overall Impression</h4>
        <p className="text-xs text-muted-foreground">{data.overall_impression}</p>
      </div>
    </>
  );
}

function DISCAnalysisContent({ data }: { data: DISCAnalysis }) {
  return (
    <>
      {/* Profile Type Badge */}
      <div className="flex items-center gap-3">
        <Badge className={`text-lg px-4 py-2 ${DISC_COLORS[data.profile_type]}`}>
          {data.profile_type}
        </Badge>
        <div>
          <p className="font-semibold text-sm">{DISC_LABELS[data.profile_type]}</p>
          <p className="text-xs text-muted-foreground">{data.profile_description}</p>
        </div>
      </div>

      {/* Dominant Traits */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <User className="w-3 h-3" /> Dominant Traits
        </h4>
        <div className="flex flex-wrap gap-1">
          {data.dominant_traits.map((trait, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {trait}
            </Badge>
          ))}
        </div>
      </div>

      {/* Communication & Work Style */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Communication
          </h4>
          <p className="text-xs text-muted-foreground">{data.communication_style}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Work Style
          </h4>
          <p className="text-xs text-muted-foreground">{data.work_style}</p>
        </div>
      </div>

      {/* Strengths */}
      <div>
        <h4 className="text-xs font-semibold text-green-600 mb-2">✓ Strengths</h4>
        <ul className="text-xs space-y-1">
          {data.strengths.map((strength, i) => (
            <li key={i} className="text-muted-foreground">• {strength}</li>
          ))}
        </ul>
      </div>

      {/* Challenges */}
      <div>
        <h4 className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Potential Challenges
        </h4>
        <ul className="text-xs space-y-1">
          {data.potential_challenges.map((challenge, i) => (
            <li key={i} className="text-muted-foreground">• {challenge}</li>
          ))}
        </ul>
      </div>

      {/* Management Tips */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
        <h4 className="text-xs font-semibold mb-1">💡 Management Tips</h4>
        <p className="text-xs text-muted-foreground">{data.management_tips}</p>
      </div>

      {/* Team Fit */}
      <div className="p-3 bg-secondary/30 rounded-lg">
        <h4 className="text-xs font-semibold mb-1">👥 Team Fit Considerations</h4>
        <p className="text-xs text-muted-foreground">{data.team_fit_considerations}</p>
      </div>
    </>
  );
}
