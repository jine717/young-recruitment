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
import { Sparkles, Loader2, FileText, Brain, MessageSquare, Mic } from 'lucide-react';
import { useTriggerFinalEvaluation } from '@/hooks/useFinalEvaluation';

interface FinalEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  candidateName: string;
}

export function FinalEvaluationModal({
  open,
  onOpenChange,
  applicationId,
  candidateName,
}: FinalEvaluationModalProps) {
  const [customInstructions, setCustomInstructions] = useState('');
  const triggerFinalEvaluation = useTriggerFinalEvaluation();

  const handleAnalyze = async () => {
    await triggerFinalEvaluation.mutateAsync({
      applicationId,
      customInstructions: customInstructions.trim() || undefined,
    });
    onOpenChange(false);
    setCustomInstructions('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--young-gold))]" />
            Final Candidate Evaluation
          </DialogTitle>
          <DialogDescription>
            AI will generate a comprehensive final evaluation for <strong>{candidateName}</strong> combining all assessment stages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What will be analyzed */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Data sources for analysis:</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-blue))]/10">
                  <FileText className="h-4 w-4 text-[hsl(var(--young-blue))]" />
                </div>
                <span className="text-xs text-muted-foreground">CV</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-gold))]/10">
                  <Brain className="h-4 w-4 text-[hsl(var(--young-gold))]" />
                </div>
                <span className="text-xs text-muted-foreground">DISC</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-khaki))]/10">
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--young-khaki))]" />
                </div>
                <span className="text-xs text-muted-foreground">BCQ</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Mic className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-xs text-muted-foreground">Interview</span>
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
              placeholder="E.g., Focus on leadership potential, consider specific role requirements, evaluate risk tolerance for senior positions..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use standard comprehensive evaluation criteria
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={triggerFinalEvaluation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={triggerFinalEvaluation.isPending}
            className="bg-[hsl(var(--young-gold))] hover:bg-[hsl(var(--young-gold))]/90 text-[hsl(var(--young-bold-black))]"
          >
            {triggerFinalEvaluation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Final Evaluation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
