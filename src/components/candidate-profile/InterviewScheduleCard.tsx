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

const statusConfig: Record<InterviewStatus, { className: string; label: string }> = {
  scheduled: { 
    className: 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/50', 
    label: 'Scheduled' 
  },
  completed: { 
    className: 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/50', 
    label: 'Completed' 
  },
  cancelled: { 
    className: 'bg-destructive/10 text-destructive border-destructive/50', 
    label: 'Cancelled' 
  },
  rescheduled: { 
    className: 'bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/50', 
    label: 'Rescheduled' 
  },
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[hsl(var(--young-gold))]" />
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[hsl(var(--young-gold))]" />
          Scheduled Interviews
          {activeInterviews.length > 0 && (
            <Badge variant="secondary">{activeInterviews.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No interviews scheduled</p>
            <p className="text-xs mt-1">Schedule an interview from the header actions</p>
          </div>
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
                      <Badge className={statusConfig[interview.status].className}>
                        {statusConfig[interview.status].label}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
