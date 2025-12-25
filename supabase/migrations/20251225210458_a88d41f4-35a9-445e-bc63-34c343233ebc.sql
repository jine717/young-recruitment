-- Create table to store candidate consent records for GDPR/LOPDGDD compliance
CREATE TABLE public.candidate_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  cookies_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  authorization_statement_accepted BOOLEAN NOT NULL DEFAULT false,
  cookies_policy_version TEXT NOT NULL,
  authorization_statement_version TEXT NOT NULL,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.candidate_consents ENABLE ROW LEVEL SECURITY;

-- Anon can create consents (when applying without authentication)
CREATE POLICY "Anon can create consents" ON public.candidate_consents
  FOR INSERT WITH CHECK (true);

-- Authenticated users can also create consents
CREATE POLICY "Authenticated can create consents" ON public.candidate_consents
  FOR INSERT TO authenticated WITH CHECK (true);

-- Recruiters and admins can view consents
CREATE POLICY "Recruiters and admins can view consents" ON public.candidate_consents
  FOR SELECT USING (
    has_role(auth.uid(), 'recruiter'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Management can view consents
CREATE POLICY "Management can view consents" ON public.candidate_consents
  FOR SELECT USING (has_role(auth.uid(), 'management'::app_role));