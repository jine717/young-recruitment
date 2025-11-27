-- Create recruiter_notes table
CREATE TABLE public.recruiter_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recruiter_notes ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view notes
CREATE POLICY "Recruiters and admins can view notes"
ON public.recruiter_notes
FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Recruiters and admins can create notes
CREATE POLICY "Recruiters and admins can create notes"
ON public.recruiter_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Recruiters and admins can update their own notes
CREATE POLICY "Recruiters and admins can update their own notes"
ON public.recruiter_notes
FOR UPDATE
USING (recruiter_id = auth.uid() AND (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin')));

-- Recruiters and admins can delete their own notes
CREATE POLICY "Recruiters and admins can delete their own notes"
ON public.recruiter_notes
FOR DELETE
USING (recruiter_id = auth.uid() AND (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin')));

-- Create trigger for updated_at
CREATE TRIGGER update_recruiter_notes_updated_at
BEFORE UPDATE ON public.recruiter_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();