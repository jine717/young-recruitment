-- Create table for recruiter notes on fixed questions (per application)
CREATE TABLE public.fixed_question_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  fixed_question_id UUID NOT NULL REFERENCES public.job_fixed_questions(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL,
  note_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, fixed_question_id)
);

-- Enable RLS
ALTER TABLE public.fixed_question_notes ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view notes
CREATE POLICY "Recruiters and admins can view fixed question notes"
ON public.fixed_question_notes
FOR SELECT
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Recruiters and admins can create notes
CREATE POLICY "Recruiters and admins can create fixed question notes"
ON public.fixed_question_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Recruiters and admins can update their own notes
CREATE POLICY "Recruiters and admins can update their own notes"
ON public.fixed_question_notes
FOR UPDATE
USING (recruiter_id = auth.uid() AND (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- Recruiters and admins can delete their own notes
CREATE POLICY "Recruiters and admins can delete their own notes"
ON public.fixed_question_notes
FOR DELETE
USING (recruiter_id = auth.uid() AND (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fixed_question_notes_updated_at
BEFORE UPDATE ON public.fixed_question_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();