import { useParams, Link } from 'react-router-dom';
import { CandidateLayout } from '@/components/candidate-portal/CandidateLayout';
import { ApplicationTimeline } from '@/components/candidate-portal/ApplicationTimeline';
import { StatusIndicator } from '@/components/candidate-portal/StatusIndicator';
import { useCandidateApplication } from '@/hooks/useCandidateApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: application, isLoading } = useCandidateApplication(id);

  if (isLoading) {
    return (
      <CandidateLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </CandidateLayout>
    );
  }

  if (!application) {
    return (
      <CandidateLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">Application not found</h3>
              <p className="text-muted-foreground mb-6">
                This application may have been removed or you don't have access to it.
              </p>
              <Button asChild>
                <Link to="/candidate">Back to Applications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </CandidateLayout>
    );
  }

  const needsBusinessCase = !application.business_case_completed && 
    ['under_review', 'interview'].includes(application.status);

  return (
    <CandidateLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/candidate">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {application.jobs?.title || 'Unknown Position'}
            </h1>
            <StatusIndicator 
              status={application.status} 
              businessCaseCompleted={application.business_case_completed} 
            />
          </div>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
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
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Action needed alert */}
            {needsBusinessCase && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        Action Required: Complete Business Case
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete the business case assessment to move forward in the application process.
                      </p>
                      <Button asChild>
                        <Link to={`/business-case/${application.job_id}?applicationId=${application.id}`}>
                          Start Business Case
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents submitted */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents Submitted</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">CV / Resume</p>
                      <p className="text-sm text-muted-foreground">
                        {application.cv_url ? 'Uploaded' : 'Not submitted'}
                      </p>
                    </div>
                  </div>
                  {application.cv_url && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">DISC Assessment</p>
                      <p className="text-sm text-muted-foreground">
                        {application.disc_url ? 'Uploaded' : 'Not submitted'}
                      </p>
                    </div>
                  </div>
                  {application.disc_url && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Business Case</p>
                      <p className="text-sm text-muted-foreground">
                        {application.business_case_completed 
                          ? `Completed ${application.business_case_completed_at 
                              ? new Date(application.business_case_completed_at).toLocaleDateString() 
                              : ''}`
                          : 'Not completed'}
                      </p>
                    </div>
                  </div>
                  {application.business_case_completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job description */}
            {application.jobs?.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About This Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {application.jobs.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Timeline */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <ApplicationTimeline
                  status={application.status}
                  businessCaseCompleted={application.business_case_completed}
                  createdAt={application.created_at}
                  businessCaseCompletedAt={application.business_case_completed_at}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
