import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, MessageSquare, ClipboardList, StickyNote } from 'lucide-react';
import { useTriggerInterviewAnalysis } from '@/hooks/useInterviewAnalysis';
import { useToast } from '@/hooks/use-toast';

interface InterviewAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  candidateName: string;
  onSuccess?: () => void;
}

export function InterviewAnalysisModal({
  open,
  onOpenChange,
  applicationId,
  candidateName,
  onSuccess,
}: InterviewAnalysisModalProps) {
  const [customInstructions, setCustomInstructions] = useState('');
  const triggerAnalysis = useTriggerInterviewAnalysis();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    try {
      await triggerAnalysis.mutateAsync({
        applicationId,
        customInstructions: customInstructions.trim() || undefined,
      });
      toast({
        title: "Interview Analyzed",
        description: "The interview analysis has been completed.",
      });
      onOpenChange(false);
      setCustomInstructions('');
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze interview",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--young-blue))]" />
            Interview Analysis
          </DialogTitle>
          <DialogDescription>
            AI will analyze the interview for <strong>{candidateName}</strong> based on questions and recruiter notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What will be analyzed */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Data sources for analysis:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-blue))]/10">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--young-blue))]" />
                </div>
                <span className="text-xs text-muted-foreground">AI Questions + Notes</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-gold))]/10">
                  <ClipboardList className="h-4 w-4 text-[hsl(var(--young-gold))]" />
                </div>
                <span className="text-xs text-muted-foreground">Fixed Questions + Notes</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-khaki))]/10">
                  <StickyNote className="h-4 w-4 text-[hsl(var(--young-khaki))]" />
                </div>
                <span className="text-xs text-muted-foreground">Recruiter Notes</span>
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="customInstructions">
              Custom Instructions <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="customInstructions"
              placeholder="E.g., Focus on technical depth, evaluate cultural fit more critically, pay attention to problem-solving approach..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use standard evaluation criteria
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={triggerAnalysis.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={triggerAnalysis.isPending}
            className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
          >
            {triggerAnalysis.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
