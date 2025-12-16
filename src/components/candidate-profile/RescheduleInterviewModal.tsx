import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Video, Phone, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUpdateInterview, Interview, InterviewType } from '@/hooks/useInterviews';
import { useSendNotification } from '@/hooks/useNotifications';
import { useLogInterviewHistory } from '@/hooks/useInterviewHistory';

interface RescheduleInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const durationOptions = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
];

export function RescheduleInterviewModal({
  open,
  onOpenChange,
  interview,
  applicationId,
  candidateName,
  jobTitle,
}: RescheduleInterviewModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [interviewType, setInterviewType] = useState<InterviewType>('video');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notesForCandidate, setNotesForCandidate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const updateInterview = useUpdateInterview();
  const sendNotification = useSendNotification();
  const logHistory = useLogInterviewHistory();

  // Pre-populate form with existing interview data
  useEffect(() => {
    if (interview && open) {
      const existingDate = new Date(interview.interview_date);
      setDate(existingDate);
      setTime(format(existingDate, 'HH:mm'));
      setDuration(interview.duration_minutes);
      setInterviewType(interview.interview_type);
      setLocation(interview.location || '');
      setMeetingLink(interview.meeting_link || '');
      setNotesForCandidate(interview.notes_for_candidate || '');
      setInternalNotes(interview.internal_notes || '');
    }
  }, [interview, open]);

  const handleSubmit = async () => {
    if (!date || !time) return;

    const [hours, minutes] = time.split(':').map(Number);
    const interviewDate = new Date(date);
    interviewDate.setHours(hours, minutes, 0, 0);

    const previousDate = interview.interview_date;
    const previousType = interview.interview_type;

    try {
      await updateInterview.mutateAsync({
        id: interview.id,
        interview_date: interviewDate.toISOString(),
        duration_minutes: duration,
        interview_type: interviewType,
        location: location || undefined,
        meeting_link: meetingLink || undefined,
        notes_for_candidate: notesForCandidate || undefined,
        internal_notes: internalNotes || undefined,
        status: 'rescheduled',
      });

      // Log the reschedule history
      await logHistory.mutateAsync({
        interviewId: interview.id,
        changeType: 'rescheduled',
        previousDate,
        newDate: interviewDate.toISOString(),
        previousType,
        newType: interviewType,
      });

      // Send rescheduled notification to candidate
      await sendNotification.mutateAsync({
        applicationId,
        type: 'interview_rescheduled',
        interviewDate: format(interviewDate, 'MMMM d, yyyy'),
        interviewTime: format(interviewDate, 'h:mm a'),
      });

      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = updateInterview.isPending || sendNotification.isPending || logHistory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Interview</DialogTitle>
          <DialogDescription>
            Reschedule the interview with {candidateName} for the {jobTitle} position.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time">
                    {time && (
                      <span className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <RadioGroup
              value={interviewType}
              onValueChange={(v) => setInterviewType(v as InterviewType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="reschedule-video" />
                <Label htmlFor="reschedule-video" className="flex items-center cursor-pointer">
                  <Video className="mr-1 h-4 w-4" /> Video
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="reschedule-phone" />
                <Label htmlFor="reschedule-phone" className="flex items-center cursor-pointer">
                  <Phone className="mr-1 h-4 w-4" /> Phone
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_person" id="reschedule-in_person" />
                <Label htmlFor="reschedule-in_person" className="flex items-center cursor-pointer">
                  <MapPin className="mr-1 h-4 w-4" /> In-Person
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Location / Meeting Link */}
          {interviewType === 'in_person' ? (
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="Office address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <Input
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          )}

          {/* Notes for Candidate */}
          <div className="space-y-2">
            <Label>Notes for Candidate</Label>
            <Textarea
              placeholder="What should the candidate prepare? Any specific topics to review?"
              value={notesForCandidate}
              onChange={(e) => setNotesForCandidate(e.target.value)}
              rows={3}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label>Internal Notes (Recruiter Only)</Label>
            <Textarea
              placeholder="Internal notes about this interview..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || !time || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reschedule & Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
