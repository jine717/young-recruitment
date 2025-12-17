import { CheckCircle2, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CompletionScreenProps {
  candidateName: string;
  jobTitle: string;
  totalQuestions: number;
  responseTimeMinutes?: number;
}

export function CompletionScreen({ 
  candidateName, 
  jobTitle, 
  totalQuestions,
  responseTimeMinutes 
}: CompletionScreenProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-chart-1/20 bg-card shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-chart-1/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-chart-1" />
            </div>
          </div>
          
          {/* Main Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              All Done, {candidateName}!
            </h1>
            <p className="text-muted-foreground">
              Your Business Case responses have been submitted successfully.
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalQuestions}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            
            {responseTimeMinutes && (
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {formatTime(responseTimeMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            )}
          </div>
          
          {/* Position Info */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Position applied for:
            </p>
            <p className="font-semibold text-foreground">{jobTitle}</p>
          </div>
          
          {/* Next Steps */}
          <div className="space-y-3 pt-4">
            <h3 className="font-medium text-foreground">What's Next?</h3>
            
            <div className="flex items-start gap-3 text-left p-3 bg-muted/20 rounded-lg">
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Confirmation Email
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll receive a confirmation email shortly
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left p-3 bg-muted/20 rounded-lg">
              <Clock className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Review Process
                </p>
                <p className="text-xs text-muted-foreground">
                  Our team will review your responses and get back to you
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Thank you for taking the time to complete this assessment.
            </p>
            <p className="text-sm font-display text-foreground mt-2">
              YOUNG RECRUITMENT.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
