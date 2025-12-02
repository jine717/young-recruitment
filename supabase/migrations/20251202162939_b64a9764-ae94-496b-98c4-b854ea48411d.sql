-- Drop existing policies that don't work for anonymous users
DROP POLICY IF EXISTS "Anyone can create applications with candidate info" ON public.applications;
DROP POLICY IF EXISTS "Anyone can create responses for their application" ON public.business_case_responses;
DROP POLICY IF EXISTS "Anyone can upload CVs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read CVs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload DISC assessments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read DISC assessments" ON storage.objects;

-- Create policies with explicit anon role for applications
CREATE POLICY "Anon can create applications" 
ON public.applications 
FOR INSERT 
TO anon
WITH CHECK (candidate_name IS NOT NULL AND candidate_email IS NOT NULL);

-- Create policies with explicit anon role for business case responses
CREATE POLICY "Anon can create business case responses" 
ON public.business_case_responses 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create storage policies for CVs bucket
CREATE POLICY "Anon can upload CVs"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'cvs');

CREATE POLICY "Anon can read CVs"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'cvs');

-- Create storage policies for DISC assessments bucket
CREATE POLICY "Anon can upload DISC"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'disc-assessments');

CREATE POLICY "Anon can read DISC"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'disc-assessments');