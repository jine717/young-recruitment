import { format } from 'date-fns';
import { Calendar, Clock, Video, Phone, MapPin, ExternalLink, MoreVertical, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Interview, InterviewType, InterviewStatus, useCancelInterview, useUpdateInterview } from '@/hooks/useInterviews';

interface InterviewScheduleCardProps {
  interviews: Interview[];
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
  in_person: 'In-Person',
};

const statusColors: Record<InterviewStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export function InterviewScheduleCard({ interviews, isLoading }: InterviewScheduleCardProps) {
  const cancelInterview = useCancelInterview();
  const updateInterview = useUpdateInterview();

  const handleCancel = (id: string) => {
    cancelInterview.mutate(id);
  };

  const handleMarkCompleted = (id: string) => {
    updateInterview.mutate({ id, status: 'completed' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Interviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeInterviews = interviews.filter(i => i.status !== 'cancelled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Interviews
          {activeInterviews.length > 0 && (
            <Badge variant="secondary">{activeInterviews.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className={`border rounded-lg p-4 ${
                  interview.status === 'cancelled' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[interview.status]}>
                        {statusLabels[interview.status]}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        {typeIcons[interview.interview_type]}
                        {typeLabels[interview.interview_type]}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(interview.interview_date), 'MMMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(interview.interview_date), 'h:mm a')}
                        <span className="text-muted-foreground">
                          ({interview.duration_minutes} min)
                        </span>
                      </span>
                    </div>

                    {interview.meeting_link && (
                      <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}

                    {interview.location && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {interview.location}
                      </p>
                    )}

                    {interview.internal_notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Note: {interview.internal_notes}
                      </p>
                    )}
                  </div>

                  {interview.status === 'scheduled' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMarkCompleted(interview.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancel(interview.id)}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Interview
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
