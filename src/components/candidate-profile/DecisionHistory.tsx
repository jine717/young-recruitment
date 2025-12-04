import { format } from 'date-fns';
import { useHiringDecisions, type HiringDecision } from '@/hooks/useHiringDecisions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DecisionHistoryProps {
  applicationId: string;
}

function DecisionBadge({ decision }: { decision: HiringDecision['decision'] }) {
  const config = {
    hired: { 
      label: 'Hired', 
      className: 'bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/50',
      icon: CheckCircle 
    },
    rejected: { 
      label: 'Rejected', 
      className: 'bg-destructive/10 text-destructive border-destructive/50',
      icon: XCircle 
    },
    on_hold: { 
      label: 'On Hold', 
      className: 'bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/50',
      icon: Clock 
    },
  };

  const { label, className, icon: Icon } = config[decision];

  return (
    <Badge className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

function DecisionItem({ decision }: { decision: HiringDecision }) {
  return (
    <div className="border-l-2 border-muted pl-4 pb-4 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <DecisionBadge decision={decision.decision} />
        <span className="text-xs text-muted-foreground">
          {format(new Date(decision.created_at), 'MMM d, yyyy h:mm a')}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{decision.reasoning}</p>
      
      {decision.decision === 'hired' && (
        <div className="text-sm space-y-1">
          {decision.salary_offered && (
            <p><span className="font-medium">Salary:</span> {decision.salary_offered}</p>
          )}
          {decision.start_date && (
            <p><span className="font-medium">Start Date:</span> {format(new Date(decision.start_date), 'MMM d, yyyy')}</p>
          )}
        </div>
      )}
      
      {decision.decision === 'rejected' && decision.rejection_reason && (
        <p className="text-sm">
          <span className="font-medium">Rejection Reason:</span> {decision.rejection_reason}
        </p>
      )}
    </div>
  );
}

export function DecisionHistory({ applicationId }: DecisionHistoryProps) {
  const { data: decisions, isLoading } = useHiringDecisions(applicationId);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          Decision History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {decisions && decisions.length > 0 ? (
          <div className="space-y-2">
            {decisions.map((decision) => (
              <DecisionItem key={decision.id} decision={decision} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <History className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No hiring decisions recorded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
