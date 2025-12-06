import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddHiringDecision } from '@/hooks/useHiringDecisions';
import { useUpdateApplicationStatus } from '@/hooks/useApplications';
import { useSendNotification, type NotificationType } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Gavel, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const decisionSchema = z.object({
  decision: z.enum(['hired', 'rejected', 'on_hold']),
  reasoning: z.string().min(10, 'Please provide reasoning'),
  salaryOffered: z.string().optional(),
  startDate: z.string().optional(),
  rejectionReason: z.string().optional(),
});

type DecisionFormData = z.infer<typeof decisionSchema>;

interface HiringDecisionModalProps {
  applicationId: string;
}

export function HiringDecisionModal({ applicationId }: HiringDecisionModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const addDecision = useAddHiringDecision();
  const updateStatus = useUpdateApplicationStatus();
  const sendNotification = useSendNotification();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<DecisionFormData>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      decision: 'hired',
      reasoning: '',
      salaryOffered: '',
      startDate: '',
      rejectionReason: '',
    },
  });

  const selectedDecision = watch('decision');

  const onSubmit = async (data: DecisionFormData) => {
    try {
      // Save the decision
      await addDecision.mutateAsync({
        applicationId,
        decision: data.decision,
        reasoning: data.reasoning,
        salaryOffered: data.salaryOffered,
        startDate: data.startDate,
        rejectionReason: data.rejectionReason,
      });

      // Update application status
      const statusMap = {
        hired: 'hired',
        rejected: 'rejected',
        on_hold: 'under_review',
      } as const;
      await updateStatus(applicationId, statusMap[data.decision]);

      // Send notification
      const notificationMap: Record<string, NotificationType> = {
        hired: 'decision_offer',
        rejected: 'decision_rejection',
      };
      if (notificationMap[data.decision]) {
        sendNotification.mutate({
          applicationId,
          type: notificationMap[data.decision],
        });
      }

      toast({ title: 'Hiring decision recorded' });
      reset();
      setOpen(false);
    } catch (error) {
      toast({ title: 'Error recording decision', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="bg-[hsl(var(--young-gold))] hover:bg-[hsl(var(--young-gold))]/90 text-white"
        >
          <Gavel className="w-4 h-4 mr-2" />
          Decision
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Make Hiring Decision</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label>Decision</Label>
            <RadioGroup
              value={selectedDecision}
              onValueChange={(v) => setValue('decision', v as any)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="hired" id="hired" />
                <Label htmlFor="hired" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="w-4 h-4 text-[hsl(var(--young-blue))]" />
                  Hire Candidate
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Reject Candidate
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="on_hold" id="on_hold" />
                <Label htmlFor="on_hold" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="w-4 h-4 text-[hsl(var(--young-gold))]" />
                  Put On Hold
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="reasoning">Reasoning</Label>
            <Textarea
              id="reasoning"
              placeholder="Explain the reasoning behind this decision..."
              rows={3}
              {...register('reasoning')}
            />
            {errors.reasoning && (
              <p className="text-sm text-destructive mt-1">{errors.reasoning.message}</p>
            )}
          </div>

          {selectedDecision === 'hired' && (
            <>
              <div>
                <Label htmlFor="salaryOffered">Salary Offered (optional)</Label>
                <Input
                  id="salaryOffered"
                  placeholder="e.g., €50,000 per year"
                  {...register('salaryOffered')}
                />
              </div>
              <div>
                <Label htmlFor="startDate">Proposed Start Date (optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
              </div>
            </>
          )}

          {selectedDecision === 'rejected' && (
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason (optional)</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Additional details about why the candidate was not selected..."
                rows={2}
                {...register('rejectionReason')}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addDecision.isPending}
              className="bg-[hsl(var(--young-gold))] hover:bg-[hsl(var(--young-gold))]/90 text-white"
            >
              {addDecision.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Decision
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
