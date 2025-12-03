-- Create candidate_comparisons table for storing comparison results
CREATE TABLE public.candidate_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  application_ids UUID[] NOT NULL,
  evaluation_prompt TEXT,
  comparison_result JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Recruiters and admins can create comparisons"
ON public.candidate_comparisons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can view comparisons"
ON public.candidate_comparisons
FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can update comparisons"
ON public.candidate_comparisons
FOR UPDATE
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can delete comparisons"
ON public.candidate_comparisons
FOR DELETE
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));