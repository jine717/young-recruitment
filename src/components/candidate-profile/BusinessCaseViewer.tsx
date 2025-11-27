import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/business-case/VideoPlayer';
import { Video, FileText, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

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
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const getSignedUrls = async () => {
      if (!responses) return;

      const urls: Record<string, string> = {};
      for (const response of responses) {
        if (response.video_url) {
          const { data, error } = await supabase.storage
            .from('business-case-videos')
            .createSignedUrl(response.video_url, 3600);

          if (!error && data) {
            urls[response.id] = data.signedUrl;
          }
        }
      }
      setSignedUrls(urls);
    };

    getSignedUrls();
  }, [responses]);

  const isLoading = casesLoading || responsesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5" />
            Business Case Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5" />
            Business Case Responses
          </CardTitle>
          <Badge variant={completedCount === totalCount ? 'default' : 'secondary'}>
            {completedCount}/{totalCount} Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {businessCases?.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No business case questions for this position.
          </p>
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
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
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

                    {response.video_url && signedUrls[response.id] && (
                      <VideoPlayer
                        src={signedUrls[response.id]}
                        title="Video Response"
                      />
                    )}

                    {response.text_response && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Text Response
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {response.text_response}
                        </p>
                      </div>
                    )}

                    {!response.video_url && !response.text_response && (
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
    </Card>
  );
}
