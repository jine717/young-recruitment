import { useState } from 'react';
import { format } from 'date-fns';
import { History, Trash2, Eye, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useComparisonHistory, useDeleteComparison, SavedComparison, ComparisonResult } from '@/hooks/useCandidateComparison';
import { ComparisonResultCard } from './ComparisonResultCard';

interface ComparisonHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
}

export function ComparisonHistoryDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
}: ComparisonHistoryDialogProps) {
  const { data: history, isLoading } = useComparisonHistory(jobId);
  const deleteComparison = useDeleteComparison();
  const [selectedComparison, setSelectedComparison] = useState<SavedComparison | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      deleteComparison.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (selectedComparison) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedComparison(null)}
              >
                ← Back to History
              </Button>
            </div>
            <DialogTitle className="text-lg">
              Comparison from {format(new Date(selectedComparison.created_at), 'MMM d, yyyy h:mm a')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <ComparisonResultCard result={selectedComparison.comparison_result} jobTitle={jobTitle} jobId={selectedComparison.job_id} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Comparison History - {jobTitle}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No comparison history for this job yet.</p>
              <p className="text-sm">Run a candidate comparison to see it here.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 pr-4">
                {history.map((comparison) => (
                  <div
                    key={comparison.id}
                    className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(comparison.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                        <p className="font-medium mt-1">
                          {comparison.application_ids.length} candidates compared
                        </p>
                        {comparison.comparison_result?.recommendation?.top_choice && (
                          <p className="text-sm text-primary mt-1">
                            🏆 Recommended: {comparison.comparison_result.recommendation.top_choice}
                          </p>
                        )}
                        {comparison.evaluation_prompt && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            Instructions: {comparison.evaluation_prompt}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedComparison(comparison)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(comparison.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comparison?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this comparison from history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
