import { cn } from '@/lib/utils';
import { Check, Clock, FileText, Users, Award } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'pending' | 'under_review' | 'interview' | 'rejected' | 'hired';
  businessCaseCompleted: boolean;
}

const statusConfig = {
  pending: { label: 'Applied', color: 'bg-muted text-muted-foreground' },
  under_review: { label: 'Under Review', color: 'bg-primary/20 text-primary' },
  interview: { label: 'Interview', color: 'bg-accent text-accent-foreground' },
  rejected: { label: 'Not Selected', color: 'bg-destructive/20 text-destructive' },
  hired: { label: 'Hired', color: 'bg-green-500/20 text-green-700' },
};

export function StatusIndicator({ status, businessCaseCompleted }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', config.color)}>
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}
