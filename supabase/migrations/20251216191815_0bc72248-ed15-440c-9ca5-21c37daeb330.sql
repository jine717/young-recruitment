-- Add new enum values to application_status
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'reviewed';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interviewed';

-- Create review_progress table to track recruiter review of each section
CREATE TABLE public.review_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL,
  
  -- Sections to review
  ai_analysis_reviewed BOOLEAN NOT NULL DEFAULT false,
  cv_analysis_reviewed BOOLEAN NOT NULL DEFAULT false,
  disc_analysis_reviewed BOOLEAN NOT NULL DEFAULT false,
  business_case_reviewed BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(application_id, recruiter_id)
);

-- Enable RLS
ALTER TABLE public.review_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Recruiters and admins can view review progress"
ON public.review_progress
FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can create review progress"
ON public.review_progress
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can update their own review progress"
ON public.review_progress
FOR UPDATE
USING (recruiter_id = auth.uid() AND (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Management can view review progress"
ON public.review_progress
FOR SELECT
USING (has_role(auth.uid(), 'management'));

-- Trigger for updated_at
CREATE TRIGGER update_review_progress_updated_at
BEFORE UPDATE ON public.review_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();