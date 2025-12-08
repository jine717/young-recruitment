import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useAddInterviewEvaluation } from '@/hooks/useInterviewEvaluations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Loader2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const evaluationSchema = z.object({
  interviewDate: z.string().min(1, 'Interview date is required'),
  technicalScore: z.number().min(1).max(5),
  communicationScore: z.number().min(1).max(5),
  culturalFitScore: z.number().min(1).max(5),
  problemSolvingScore: z.number().min(1).max(5),
  overallImpression: z.string().min(10, 'Please provide more detail'),
  strengths: z.string(),
  areasForImprovement: z.string(),
  recommendation: z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface InterviewEvaluationFormProps {
  applicationId: string;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value ? 'fill-primary text-primary' : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function InterviewEvaluationForm({ applicationId }: InterviewEvaluationFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const addEvaluation = useAddInterviewEvaluation();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      interviewDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      technicalScore: 3,
      communicationScore: 3,
      culturalFitScore: 3,
      problemSolvingScore: 3,
      overallImpression: '',
      strengths: '',
      areasForImprovement: '',
      recommendation: 'hire',
    },
  });

  const onSubmit = async (data: EvaluationFormData) => {
    try {
      await addEvaluation.mutateAsync({
        applicationId,
        interviewDate: data.interviewDate,
        technicalScore: data.technicalScore,
        communicationScore: data.communicationScore,
        culturalFitScore: data.culturalFitScore,
        problemSolvingScore: data.problemSolvingScore,
        overallImpression: data.overallImpression,
        strengths: data.strengths.split('\n').filter(s => s.trim()),
        areasForImprovement: data.areasForImprovement.split('\n').filter(s => s.trim()),
        recommendation: data.recommendation,
      });
      toast({ title: 'Interview evaluation saved' });
      reset();
      setOpen(false);
    } catch (error) {
      toast({ title: 'Error saving evaluation', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Evaluate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Interview Evaluation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="interviewDate">Interview Date & Time</Label>
            <Input
              id="interviewDate"
              type="datetime-local"
              {...register('interviewDate')}
            />
            {errors.interviewDate && (
              <p className="text-sm text-destructive mt-1">{errors.interviewDate.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StarRating
              label="Technical Skills"
              value={watch('technicalScore')}
              onChange={(v) => setValue('technicalScore', v)}
            />
            <StarRating
              label="Communication"
              value={watch('communicationScore')}
              onChange={(v) => setValue('communicationScore', v)}
            />
            <StarRating
              label="Cultural Fit"
              value={watch('culturalFitScore')}
              onChange={(v) => setValue('culturalFitScore', v)}
            />
            <StarRating
              label="Problem Solving"
              value={watch('problemSolvingScore')}
              onChange={(v) => setValue('problemSolvingScore', v)}
            />
          </div>

          <div>
            <Label htmlFor="overallImpression">Overall Impression</Label>
            <Textarea
              id="overallImpression"
              placeholder="Describe your overall impression of the candidate..."
              rows={3}
              {...register('overallImpression')}
            />
            {errors.overallImpression && (
              <p className="text-sm text-destructive mt-1">{errors.overallImpression.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="strengths">Strengths (one per line)</Label>
            <Textarea
              id="strengths"
              placeholder="Strong analytical skills&#10;Excellent communication&#10;Relevant experience"
              rows={3}
              {...register('strengths')}
            />
          </div>

          <div>
            <Label htmlFor="areasForImprovement">Areas for Improvement (one per line)</Label>
            <Textarea
              id="areasForImprovement"
              placeholder="Could improve technical depth&#10;Limited leadership experience"
              rows={3}
              {...register('areasForImprovement')}
            />
          </div>

          <div>
            <Label>Recommendation</Label>
            <Select
              value={watch('recommendation')}
              onValueChange={(v) => setValue('recommendation', v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strong_hire">Strong Hire</SelectItem>
                <SelectItem value="hire">Hire</SelectItem>
                <SelectItem value="no_hire">No Hire</SelectItem>
                <SelectItem value="strong_no_hire">Strong No Hire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addEvaluation.isPending}
              className="bg-[hsl(var(--young-blue))] hover:bg-[hsl(var(--young-blue))]/90 text-white"
            >
              {addEvaluation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Evaluation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
