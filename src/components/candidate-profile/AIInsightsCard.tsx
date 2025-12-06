import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocumentAnalyses, type CVAnalysis, type DISCAnalysis } from '@/hooks/useDocumentAnalysis';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lightbulb, 
  FileText, 
  UserCircle, 
  MessageSquareText, 
  ChevronDown,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface AIInsightsCardProps {
  applicationId: string;
  jobId: string;
}

export function AIInsightsCard({ applicationId, jobId }: AIInsightsCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const { data: documentAnalyses, isLoading: docLoading } = useDocumentAnalyses(applicationId);
  
  const { data: businessCaseResponses, isLoading: bcLoading } = useQuery({
    queryKey: ['business-case-responses', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_case_responses')
        .select('*, business_cases(question_title)')
        .eq('application_id', applicationId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!applicationId,
  });

  const isLoading = docLoading || bcLoading;

  const cvAnalysis = documentAnalyses?.find(d => d.document_type === 'cv');
  const discAnalysis = documentAnalyses?.find(d => d.document_type === 'disc');
  
  const cvData = cvAnalysis?.status === 'completed' ? cvAnalysis.analysis as CVAnalysis : null;
  const discData = discAnalysis?.status === 'completed' ? discAnalysis.analysis as DISCAnalysis : null;
  
  const hasAnyData = cvData || discData || (businessCaseResponses && businessCaseResponses.length > 0);

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!hasAnyData) {
    return null;
  }

  const getDISCColor = (type: string) => {
    switch (type) {
      case 'D': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'I': return 'bg-[hsl(var(--young-gold))]/10 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/30';
      case 'S': return 'bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/30';
      case 'C': return 'bg-[hsl(var(--young-khaki))]/10 text-[hsl(var(--young-khaki))] border-[hsl(var(--young-khaki))]/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDISCLabel = (type: string) => {
    switch (type) {
      case 'D': return 'Dominant';
      case 'I': return 'Influential';
      case 'S': return 'Steady';
      case 'C': return 'Conscientious';
      default: return type;
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                AI Insights
              </CardTitle>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-5 pt-0">
            {/* CV Insights */}
            {cvData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                  <h4 className="text-sm font-semibold">CV Analysis</h4>
                </div>
                
                <div className="pl-6 space-y-3">
                  {/* Experience & Education */}
                  <div className="flex flex-wrap gap-2">
                    {cvData.experience_years && (
                      <Badge variant="outline" className="gap-1">
                        <Briefcase className="w-3 h-3" />
                        {cvData.experience_years} years experience
                      </Badge>
                    )}
                    {cvData.education?.[0] && (
                      <Badge variant="outline" className="gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {cvData.education[0].degree}
                      </Badge>
                    )}
                  </div>

                  {/* Key Skills */}
                  {cvData.key_skills && cvData.key_skills.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Key Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {cvData.key_skills.slice(0, 5).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {cvData.key_skills.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{cvData.key_skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Strengths from CV */}
                  {cvData.strengths && cvData.strengths.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Strengths</p>
                      <ul className="space-y-0.5">
                        {cvData.strengths.slice(0, 3).map((strength, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <Sparkles className="w-3 h-3 text-[hsl(var(--young-blue))] mt-0.5 shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Red Flags */}
                  {cvData.red_flags && cvData.red_flags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Red Flags</p>
                      <ul className="space-y-0.5">
                        {cvData.red_flags.slice(0, 2).map((flag, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5 text-destructive">
                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DISC Insights */}
            {discData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                  <h4 className="text-sm font-semibold">DISC Profile</h4>
                </div>
                
                <div className="pl-6 space-y-3">
                  {/* Profile Type */}
                  <div className="flex items-center gap-2">
                    <Badge className={getDISCColor(discData.profile_type)}>
                      {discData.profile_type} - {getDISCLabel(discData.profile_type)}
                    </Badge>
                  </div>

                  {/* Dominant Traits */}
                  {discData.dominant_traits && discData.dominant_traits.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Dominant Traits</p>
                      <div className="flex flex-wrap gap-1">
                        {discData.dominant_traits.slice(0, 4).map((trait, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Communication & Work Style */}
                  <div className="grid grid-cols-2 gap-3">
                    {discData.communication_style && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Communication</p>
                        <p className="text-xs line-clamp-2">{discData.communication_style}</p>
                      </div>
                    )}
                    {discData.work_style && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Work Style</p>
                        <p className="text-xs line-clamp-2">{discData.work_style}</p>
                      </div>
                    )}
                  </div>

                  {/* Team Fit */}
                  {discData.team_fit_considerations && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Team Fit</p>
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        "{discData.team_fit_considerations}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Case Insights */}
            {businessCaseResponses && businessCaseResponses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-[hsl(var(--young-khaki))]" />
                  <h4 className="text-sm font-semibold">Business Case Responses</h4>
                  <Badge variant="secondary" className="text-xs">
                    {businessCaseResponses.length} response{businessCaseResponses.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="pl-6 space-y-2">
                  {businessCaseResponses.slice(0, 3).map((response: any, i: number) => {
                    const hasResponse = response.text_response || response.video_url;
                    const responseLength = response.text_response?.length || 0;
                    const isDetailed = responseLength > 100;
                    
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          hasResponse 
                            ? isDetailed 
                              ? 'bg-[hsl(var(--young-blue))]' 
                              : 'bg-[hsl(var(--young-gold))]'
                            : 'bg-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {response.business_cases?.question_title || `Question ${i + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {!hasResponse 
                              ? 'No response' 
                              : response.video_url 
                                ? 'Video response' 
                                : isDetailed 
                                  ? 'Detailed response' 
                                  : 'Brief response'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
