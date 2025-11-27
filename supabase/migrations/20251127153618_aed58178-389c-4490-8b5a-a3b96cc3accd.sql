-- Create document_analyses table for storing CV and DISC analysis results
CREATE TABLE public.document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('cv', 'disc')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  analysis JSONB,
  summary TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(application_id, document_type)
);

-- Enable RLS
ALTER TABLE public.document_analyses ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view analyses
CREATE POLICY "Recruiters and admins can view document analyses"
ON public.document_analyses
FOR SELECT
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage analyses (for edge function)
CREATE POLICY "Service role can manage document analyses"
ON public.document_analyses
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_document_analyses_updated_at
BEFORE UPDATE ON public.document_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();