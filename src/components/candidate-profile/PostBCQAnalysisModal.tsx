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
import { Sparkles, Loader2, FileText, Brain, MessageSquare } from 'lucide-react';
import { usePostBCQAnalysis } from '@/hooks/usePostBCQAnalysis';

interface PostBCQAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  candidateName: string;
}

export function PostBCQAnalysisModal({
  open,
  onOpenChange,
  applicationId,
  candidateName,
}: PostBCQAnalysisModalProps) {
  const [customInstructions, setCustomInstructions] = useState('');
  const postBCQAnalysis = usePostBCQAnalysis();

  const handleAnalyze = async () => {
    await postBCQAnalysis.mutateAsync({
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
            Overview + BCQ Analysis
          </DialogTitle>
          <DialogDescription>
            AI will re-evaluate <strong>{candidateName}</strong> considering all available data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What will be analyzed */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Data sources for analysis:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-blue))]/10">
                  <FileText className="h-4 w-4 text-[hsl(var(--young-blue))]" />
                </div>
                <span className="text-xs text-muted-foreground">CV Analysis</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-gold))]/10">
                  <Brain className="h-4 w-4 text-[hsl(var(--young-gold))]" />
                </div>
                <span className="text-xs text-muted-foreground">DISC Profile</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="p-2 rounded-lg bg-[hsl(var(--young-khaki))]/10">
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--young-khaki))]" />
                </div>
                <span className="text-xs text-muted-foreground">BCQ Responses</span>
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
              placeholder="E.g., Pay special attention to leadership experience, evaluate communication skills more critically, consider fit for remote work..."
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
            disabled={postBCQAnalysis.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={postBCQAnalysis.isPending}
            className="bg-[hsl(var(--young-gold))] hover:bg-[hsl(var(--young-gold))]/90 text-[hsl(var(--young-bold-black))]"
          >
            {postBCQAnalysis.isPending ? (
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
