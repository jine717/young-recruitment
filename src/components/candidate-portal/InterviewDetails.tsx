import { format } from 'date-fns';
import { Calendar, Clock, Video, Phone, MapPin, ExternalLink, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Interview, InterviewType, InterviewStatus, downloadICSFile } from '@/hooks/useInterviews';

interface InterviewDetailsProps {
  interviews: Interview[];
  jobTitle: string;
  candidateName: string;
  isLoading?: boolean;
}

const typeIcons: Record<InterviewType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  in_person: <MapPin className="h-4 w-4" />,
};

const typeLabels: Record<InterviewType, string> = {
  video: 'Video Call',
  phone: 'Phone Call',
  in_person: 'In-Person Meeting',
};

const statusColors: Record<InterviewStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<InterviewStatus, string> = {
  scheduled: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export function InterviewDetails({ interviews, jobTitle, candidateName, isLoading }: InterviewDetailsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interview Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingInterviews = interviews.filter(i => 
    i.status === 'scheduled' && new Date(i.interview_date) > new Date()
  );
  const pastInterviews = interviews.filter(i => 
    i.status === 'completed' || (i.status === 'scheduled' && new Date(i.interview_date) <= new Date())
  );

  if (interviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interview Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No interview scheduled yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll notify you when an interview is scheduled
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDownloadCalendar = (interview: Interview) => {
    downloadICSFile(interview, jobTitle, candidateName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Interview Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {upcomingInterviews.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Upcoming</h4>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="border rounded-lg p-4 bg-primary/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={statusColors[interview.status]}>
                      {statusLabels[interview.status]}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadCalendar(interview)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Add to Calendar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {typeIcons[interview.interview_type]}
                      <span className="font-medium">{typeLabels[interview.interview_type]}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(interview.interview_date), 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(interview.interview_date), 'h:mm a')}
                          {' · '}{interview.duration_minutes} minutes
                        </span>
                      </div>
                    </div>

                    {interview.meeting_link && (
                      <div className="pt-2">
                        <a
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Join Meeting
                        </a>
                      </div>
                    )}

                    {interview.location && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{interview.location}</span>
                      </div>
                    )}

                    {interview.notes_for_candidate && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <FileText className="h-4 w-4" />
                            What to Prepare
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {interview.notes_for_candidate}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastInterviews.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Past Interviews</h4>
            <div className="space-y-3">
              {pastInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="border rounded-lg p-3 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcons[interview.interview_type]}
                      <span className="text-sm">{typeLabels[interview.interview_type]}</span>
                    </div>
                    <Badge variant="outline" className={statusColors[interview.status]}>
                      {statusLabels[interview.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(interview.interview_date), 'MMMM d, yyyy at h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
