-- Add candidate info columns to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS candidate_name TEXT,
ADD COLUMN IF NOT EXISTS candidate_email TEXT;

-- Make candidate_id nullable for anonymous applications
ALTER TABLE public.applications 
ALTER COLUMN candidate_id DROP NOT NULL;

-- Drop existing restrictive INSERT policy for candidates
DROP POLICY IF EXISTS "Candidates can create applications" ON public.applications;

-- Create new policy allowing anonymous INSERT with candidate info
CREATE POLICY "Anyone can create applications with candidate info" 
ON public.applications 
FOR INSERT 
WITH CHECK (
  candidate_name IS NOT NULL AND 
  candidate_email IS NOT NULL
);

-- Update business_case_responses to allow anonymous INSERT
DROP POLICY IF EXISTS "Candidates can create their own responses" ON public.business_case_responses;
DROP POLICY IF EXISTS "Candidates can update their own responses" ON public.business_case_responses;
DROP POLICY IF EXISTS "Candidates can view their own responses" ON public.business_case_responses;

-- Allow anonymous INSERT on business_case_responses when linked to an application
CREATE POLICY "Anyone can create responses for their application" 
ON public.business_case_responses 
FOR INSERT 
WITH CHECK (true);

-- Storage policies for anonymous uploads to cvs bucket
CREATE POLICY "Anyone can upload CVs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cvs');

CREATE POLICY "Anyone can read CVs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cvs');

-- Storage policies for anonymous uploads to disc-assessments bucket
CREATE POLICY "Anyone can upload DISC assessments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'disc-assessments');

CREATE POLICY "Anyone can read DISC assessments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'disc-assessments');