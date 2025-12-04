import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, CheckCircle, Clock, MessageSquare, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessCaseViewerProps {
  applicationId: string;
  jobId: string;
}

interface BusinessCase {
  id: string;
  question_number: number;
  question_title: string;
  question_description: string;
  video_url: string | null;
  has_text_response: boolean;
}

interface BusinessCaseResponse {
  id: string;
  business_case_id: string;
  text_response: string | null;
  video_url: string | null;
  completed_at: string | null;
}

export function BusinessCaseViewer({ applicationId, jobId }: BusinessCaseViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: businessCases, isLoading: casesLoading } = useQuery({
    queryKey: ['business-cases-recruiter', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_cases')
        .select('*')
        .eq('job_id', jobId)
        .order('question_number', { ascending: true });

      if (error) throw error;
      return data as BusinessCase[];
    },
    enabled: !!jobId,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['business-case-responses-recruiter', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_case_responses')
        .select('*')
        .eq('application_id', applicationId);

      if (error) throw error;
      return data as BusinessCaseResponse[];
    },
    enabled: !!applicationId,
  });

  const isLoading = casesLoading || responsesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Business Case Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getResponseForCase = (caseId: string) => {
    return responses?.find((r) => r.business_case_id === caseId);
  };

  const completedCount = responses?.filter((r) => r.completed_at).length || 0;
  const totalCount = businessCases?.length || 0;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Business Case Responses
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={completedCount === totalCount ? 'default' : 'secondary'}>
                  {completedCount}/{totalCount} Completed
                </Badge>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {businessCases?.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No business case questions for this position.
                </p>
              </div>
            ) : (
              businessCases?.map((bc) => {
                const response = getResponseForCase(bc.id);
                const isCompleted = !!response?.completed_at;

                return (
                  <div
                    key={bc.id}
                    className="border border-border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Question {bc.question_number}
                          </span>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                          )}
                        </div>
                        <h4 className="font-semibold mt-1">{bc.question_title}</h4>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {bc.question_description}
                    </p>

                    {response ? (
                      <div className="space-y-4 pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Candidate Response
                        </p>

                        {response.text_response && (
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                Written Response
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {response.text_response}
                            </p>
                          </div>
                        )}

                        {!response.text_response && (
                          <p className="text-sm text-muted-foreground italic">
                            No response submitted yet.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm text-muted-foreground italic">
                          Not yet answered.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
