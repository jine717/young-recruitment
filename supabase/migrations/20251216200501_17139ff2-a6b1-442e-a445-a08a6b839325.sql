-- Create interview schedule history table
CREATE TABLE public.interview_schedule_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('scheduled', 'rescheduled', 'cancelled', 'completed')),
  previous_date TIMESTAMP WITH TIME ZONE,
  new_date TIMESTAMP WITH TIME ZONE,
  previous_type TEXT,
  new_type TEXT,
  changed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_schedule_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Recruiters and admins can view interview history"
ON public.interview_schedule_history
FOR SELECT
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Management can view interview history"
ON public.interview_schedule_history
FOR SELECT
USING (has_role(auth.uid(), 'management'::app_role));

CREATE POLICY "Recruiters and admins can create interview history"
ON public.interview_schedule_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Index for faster lookups
CREATE INDEX idx_interview_schedule_history_interview_id ON public.interview_schedule_history(interview_id);
CREATE INDEX idx_interview_schedule_history_created_at ON public.interview_schedule_history(created_at DESC);