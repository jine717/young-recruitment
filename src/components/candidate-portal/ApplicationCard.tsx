import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Calendar, Briefcase, ChevronRight, AlertCircle } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { CandidateApplication } from '@/hooks/useCandidateApplications';

interface ApplicationCardProps {
  application: CandidateApplication;
}

function getProgress(status: string, businessCaseCompleted: boolean): number {
  if (status === 'hired') return 100;
  if (status === 'rejected') return 100;
  if (status === 'interview') return 80;
  if (businessCaseCompleted) return 60;
  if (status === 'under_review') return 40;
  return 20;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const progress = getProgress(application.status, application.business_case_completed);
  const needsAction = !application.business_case_completed && 
    ['under_review', 'interview'].includes(application.status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {application.jobs?.title || 'Unknown Position'}
              </h3>
              <StatusIndicator 
                status={application.status} 
                businessCaseCompleted={application.business_case_completed} 
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {application.jobs?.departments?.name && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {application.jobs.departments.name}
                </span>
              )}
              {application.jobs?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {application.jobs.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Applied {new Date(application.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Action needed alert */}
            {needsAction && (
              <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                <AlertCircle className="w-4 h-4" />
                <span>Complete your business case to continue</span>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" asChild>
            <Link to={`/candidate/application/${application.id}`}>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
