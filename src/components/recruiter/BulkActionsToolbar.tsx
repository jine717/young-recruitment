import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X, RefreshCw, Mail, Download, Loader2 } from 'lucide-react';
import { ApplicationWithDetails } from '@/hooks/useApplications';

type ApplicationStatus = ApplicationWithDetails['status'];

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onStatusChange: (status: ApplicationStatus) => Promise<void>;
  onSendNotification: (type: string) => Promise<void>;
  onExport: () => void;
  isUpdating: boolean;
}

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const notificationOptions = [
  { value: 'status_update', label: 'Status Update' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'decision_offer', label: 'Offer Decision' },
  { value: 'decision_rejection', label: 'Rejection Decision' },
];

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onStatusChange,
  onSendNotification,
  onExport,
  isUpdating,
}: BulkActionsToolbarProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | ''>('');
  const [selectedNotificationType, setSelectedNotificationType] = useState<string>('');

  const handleStatusConfirm = async () => {
    if (selectedStatus) {
      await onStatusChange(selectedStatus);
      setStatusDialogOpen(false);
      setSelectedStatus('');
    }
  };

  const handleNotificationConfirm = async () => {
    if (selectedNotificationType) {
      await onSendNotification(selectedNotificationType);
      setNotificationDialogOpen(false);
      setSelectedNotificationType('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value as ApplicationStatus);
              setStatusDialogOpen(true);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <SelectValue placeholder="Change Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedNotificationType}
            onValueChange={(value) => {
              setSelectedNotificationType(value);
              setNotificationDialogOpen(true);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <SelectValue placeholder="Send Notification" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {notificationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {isUpdating && (
          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
        )}
      </div>

      {/* Status Change Confirmation */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status for {selectedCount} Applications</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the status of {selectedCount} selected applications to "
              {statusOptions.find((s) => s.value === selectedStatus)?.label}".
              Notifications will be sent automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStatus('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusConfirm} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Confirmation */}
      <AlertDialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Notification to {selectedCount} Candidates</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a "
              {notificationOptions.find((n) => n.value === selectedNotificationType)?.label}"
              notification to {selectedCount} selected candidates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedNotificationType('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleNotificationConfirm} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
