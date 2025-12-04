import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNotificationLogs, notificationTypeLabels } from '@/hooks/useNotifications';

interface NotificationHistoryProps {
  applicationId: string;
}

export function NotificationHistory({ applicationId }: NotificationHistoryProps) {
  const { data: logs, isLoading } = useNotificationLogs(applicationId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : logs?.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications sent yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs?.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  {log.status === 'sent' ? (
                    <CheckCircle className="w-4 h-4 text-[hsl(var(--young-blue))] mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {notificationTypeLabels[log.notification_type as keyof typeof notificationTypeLabels] ||
                        log.notification_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      To: {log.recipient_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <Badge 
                  className={log.status === 'sent' 
                    ? 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/50' 
                    : 'bg-destructive/10 text-destructive border-destructive/50'
                  }
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
