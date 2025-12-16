import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Video, Phone, MapPin, ExternalLink, MoreVertical, XCircle, CheckCircle, CalendarPlus, CalendarClock, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Interview, InterviewType, InterviewStatus, useCancelInterview, useUpdateInterview } from '@/hooks/useInterviews';
import { useInterviewHistory, useLogInterviewHistory, InterviewHistoryEntry } from '@/hooks/useInterviewHistory';
import { RescheduleInterviewModal } from './RescheduleInterviewModal';

interface InterviewScheduleCardProps {
  interviews: Interview[];
  isLoading?: boolean;
  onScheduleInterview?: () => void;
  canEdit?: boolean;
  applicationId?: string;
  candidateName?: string;
  jobTitle?: string;
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

const historyChangeTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  scheduled: {
    icon: <CalendarPlus className="h-3 w-3" />,
    label: 'Scheduled',
    color: 'text-[hsl(var(--young-blue))]',
  },
  rescheduled: {
    icon: <CalendarClock className="h-3 w-3" />,
    label: 'Rescheduled',
    color: 'text-[hsl(var(--young-gold))]',
  },
  cancelled: {
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled',
    color: 'text-destructive',
  },
  completed: {
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'Completed',
    color: 'text-[hsl(var(--young-blue))]',
  },
};

function InterviewHistoryTimeline({ interviewId }: { interviewId: string }) {
  const { data: history = [], isLoading } = useInterviewHistory(interviewId);
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-dashed">
        <div className="animate-pulse h-4 bg-muted rounded w-24" />
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3 pt-3 border-t border-dashed">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground">
          <History className="h-3 w-3" />
          Schedule History ({history.length})
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="relative pl-4 space-y-3">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
          
          {history.map((entry, index) => {
            const config = historyChangeTypeConfig[entry.change_type] || historyChangeTypeConfig.scheduled;
            const isLatest = index === history.length - 1;
            
            return (
              <div key={entry.id} className="relative flex gap-3 items-start">
                {/* Timeline dot */}
                <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 bg-background ${isLatest ? 'border-[hsl(var(--young-gold))]' : 'border-muted-foreground/30'}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  {entry.change_type === 'scheduled' && entry.new_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scheduled for {format(new Date(entry.new_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                  
                  {entry.change_type === 'rescheduled' && entry.previous_date && entry.new_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="line-through">{format(new Date(entry.previous_date), 'MMM d, h:mm a')}</span>
                      {' → '}
                      <span className="font-medium text-foreground">{format(new Date(entry.new_date), 'MMM d, h:mm a')}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function InterviewScheduleCard({ 
  interviews, 
  isLoading, 
  onScheduleInterview, 
  canEdit,
  applicationId,
  candidateName,
  jobTitle,
}: InterviewScheduleCardProps) {
  const cancelInterview = useCancelInterview();
  const updateInterview = useUpdateInterview();
  const logHistory = useLogInterviewHistory();
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const handleCancel = async (interview: Interview) => {
    await cancelInterview.mutateAsync(interview.id);
    // Log cancellation
    await logHistory.mutateAsync({
      interviewId: interview.id,
      changeType: 'cancelled',
      previousDate: interview.interview_date,
    });
  };

  const handleMarkCompleted = async (interview: Interview) => {
    await updateInterview.mutateAsync({ id: interview.id, status: 'completed' });
    // Log completion
    await logHistory.mutateAsync({
      interviewId: interview.id,
      changeType: 'completed',
      newDate: interview.interview_date,
    });
  };

  const handleReschedule = (interview: Interview) => {
    setSelectedInterview(interview);
    setRescheduleModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="shadow-young-sm hover-lift transition-all duration-200">
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
    <>
      <Card className="shadow-young-sm hover-lift transition-all duration-200">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[hsl(var(--young-gold))]" />
            Scheduled Interviews
            {activeInterviews.length > 0 && (
              <Badge variant="secondary">{activeInterviews.length}</Badge>
            )}
          </CardTitle>
          {canEdit && onScheduleInterview && (
            <Button 
              onClick={onScheduleInterview} 
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <CalendarPlus className="w-4 h-4" />
              Schedule
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No interviews scheduled</p>
              <p className="text-xs mt-1">Click 'Schedule' to book an interview</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    interview.status === 'cancelled' 
                      ? 'opacity-50' 
                      : 'hover:border-[hsl(var(--young-gold))]/50 hover:shadow-young-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
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

                      {/* Schedule History Timeline */}
                      <InterviewHistoryTimeline interviewId={interview.id} />
                    </div>

                    {(interview.status === 'scheduled' || interview.status === 'rescheduled') && canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMarkCompleted(interview)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReschedule(interview)}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancel(interview)}
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

      {/* Reschedule Modal */}
      {selectedInterview && applicationId && candidateName && jobTitle && (
        <RescheduleInterviewModal
          open={rescheduleModalOpen}
          onOpenChange={setRescheduleModalOpen}
          interview={selectedInterview}
          applicationId={applicationId}
          candidateName={candidateName}
          jobTitle={jobTitle}
        />
      )}
    </>
  );
}
