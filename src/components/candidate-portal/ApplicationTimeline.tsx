import { cn } from '@/lib/utils';
import { Check, Clock, FileText, Users, Award, X } from 'lucide-react';

interface ApplicationTimelineProps {
  status: 'pending' | 'under_review' | 'interview' | 'rejected' | 'hired';
  businessCaseCompleted: boolean;
  createdAt: string;
  businessCaseCompletedAt: string | null;
}

const steps = [
  { key: 'applied', label: 'Applied', icon: FileText },
  { key: 'review', label: 'Under Review', icon: Clock },
  { key: 'business_case', label: 'Business Case', icon: FileText },
  { key: 'interview', label: 'Interview', icon: Users },
  { key: 'decision', label: 'Decision', icon: Award },
];

function getStepStatus(
  stepKey: string,
  applicationStatus: string,
  businessCaseCompleted: boolean
): 'completed' | 'current' | 'upcoming' | 'rejected' {
  const statusOrder = ['pending', 'under_review', 'interview', 'hired'];
  const stepOrder = ['applied', 'review', 'business_case', 'interview', 'decision'];
  
  if (applicationStatus === 'rejected') {
    if (stepKey === 'decision') return 'rejected';
    const stepIndex = stepOrder.indexOf(stepKey);
    if (stepKey === 'applied') return 'completed';
    if (stepKey === 'review' && ['under_review', 'interview'].includes(applicationStatus)) return 'completed';
    if (stepKey === 'business_case' && businessCaseCompleted) return 'completed';
    return 'upcoming';
  }

  if (applicationStatus === 'hired') {
    return 'completed';
  }

  if (stepKey === 'applied') return 'completed';
  
  if (stepKey === 'review') {
    if (['under_review', 'interview', 'hired'].includes(applicationStatus)) return 'completed';
    if (applicationStatus === 'pending') return 'current';
  }

  if (stepKey === 'business_case') {
    if (businessCaseCompleted) return 'completed';
    if (['under_review', 'interview'].includes(applicationStatus)) return 'current';
    return 'upcoming';
  }

  if (stepKey === 'interview') {
    if (applicationStatus === 'hired') return 'completed';
    if (applicationStatus === 'interview') return 'current';
    return 'upcoming';
  }

  if (stepKey === 'decision') {
    if (applicationStatus === 'hired') return 'completed';
    return 'upcoming';
  }

  return 'upcoming';
}

export function ApplicationTimeline({
  status,
  businessCaseCompleted,
  createdAt,
  businessCaseCompletedAt,
}: ApplicationTimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Application Progress</h3>
      <div className="relative">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key, status, businessCaseCompleted);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex items-start gap-4 pb-6 last:pb-0">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-5 w-0.5 h-6 mt-10',
                    stepStatus === 'completed' ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{ top: `${index * 72 + 40}px` }}
                />
              )}

              {/* Step circle */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  stepStatus === 'completed' && 'bg-primary border-primary text-primary-foreground',
                  stepStatus === 'current' && 'bg-background border-primary text-primary',
                  stepStatus === 'upcoming' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                  stepStatus === 'rejected' && 'bg-destructive border-destructive text-destructive-foreground'
                )}
              >
                {stepStatus === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : stepStatus === 'rejected' ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pt-1">
                <p
                  className={cn(
                    'font-medium',
                    stepStatus === 'completed' && 'text-foreground',
                    stepStatus === 'current' && 'text-primary',
                    stepStatus === 'upcoming' && 'text-muted-foreground',
                    stepStatus === 'rejected' && 'text-destructive'
                  )}
                >
                  {step.label}
                  {stepStatus === 'rejected' && step.key === 'decision' && ' - Not Selected'}
                  {stepStatus === 'completed' && step.key === 'decision' && status === 'hired' && ' - Hired!'}
                </p>
                {step.key === 'applied' && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(createdAt).toLocaleDateString()}
                  </p>
                )}
                {step.key === 'business_case' && businessCaseCompletedAt && (
                  <p className="text-sm text-muted-foreground">
                    Completed {new Date(businessCaseCompletedAt).toLocaleDateString()}
                  </p>
                )}
                {step.key === 'business_case' && !businessCaseCompleted && stepStatus === 'current' && (
                  <p className="text-sm text-primary">Action required</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
