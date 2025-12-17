import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Send, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNotificationLogs, useSendNotification, notificationTypeLabels, NotificationType } from '@/hooks/useNotifications';
import { format } from 'date-fns';

interface NotificationCardProps {
  applicationId: string;
  candidateName: string;
  hasBusinessCase: boolean;
}

export function NotificationCard({ applicationId, candidateName, hasBusinessCase }: NotificationCardProps) {
  const [selectedType, setSelectedType] = useState<NotificationType>('status_in_review');
  const [customMessage, setCustomMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');

  const { data: logs, isLoading: logsLoading } = useNotificationLogs(applicationId);
  const sendNotification = useSendNotification();

  const handleSend = () => {
    sendNotification.mutate({
      applicationId,
      type: selectedType,
      customMessage: customMessage || undefined,
      interviewDate: interviewDate || undefined,
      interviewTime: interviewTime || undefined,
    });
    setCustomMessage('');
    setInterviewDate('');
    setInterviewTime('');
  };

  const notificationOptions: { value: NotificationType; label: string }[] = [
    { value: 'application_received', label: 'Application Received' },
    { value: 'status_in_review', label: 'In Review' },
    { value: 'bcq_invitation', label: 'BCQ Invitation' },
    { value: 'interview_scheduled', label: 'Interview Scheduled' },
    { value: 'decision_offer', label: 'Offer Letter' },
    { value: 'decision_rejection', label: 'Rejection Letter' },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Send Notification Form */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm">Notification Type</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType === 'interview_scheduled' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-sm">Interview Date</Label>
                <Input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Interview Time</Label>
                <Input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-sm">Custom Message (Optional)</Label>
            <Textarea
              placeholder="Add a personal message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sendNotification.isPending}
            size="sm"
            className="w-full"
          >
            {sendNotification.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {candidateName}
              </>
            )}
          </Button>
        </div>

        {/* Notification History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Sent Notifications</h4>
          {logsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                >
                  <div className="flex items-center gap-2">
                    {log.status === 'sent' ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {notificationTypeLabels[log.notification_type as NotificationType] || log.notification_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">
                      {format(new Date(log.sent_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notifications sent yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
