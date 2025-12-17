-- Add BCQ tracking columns to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS bcq_access_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS bcq_invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bcq_link_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bcq_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bcq_response_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS bcq_delayed BOOLEAN DEFAULT false;

-- Add transcription column to business_case_responses
ALTER TABLE public.business_case_responses 
ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_applications_bcq_access_token ON public.applications(bcq_access_token);

-- Allow anonymous users to read applications by token for BCQ portal access
CREATE POLICY "Anon can read applications by bcq_access_token" 
ON public.applications 
FOR SELECT 
TO anon
USING (bcq_access_token IS NOT NULL);

-- Allow anonymous users to update BCQ fields on applications
CREATE POLICY "Anon can update bcq fields on applications" 
ON public.applications 
FOR UPDATE 
TO anon
USING (bcq_access_token IS NOT NULL)
WITH CHECK (bcq_access_token IS NOT NULL);

-- Allow anonymous users to update business_case_responses
CREATE POLICY "Anon can update business case responses" 
ON public.business_case_responses 
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);