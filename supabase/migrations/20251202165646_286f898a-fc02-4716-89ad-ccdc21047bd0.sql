-- Allow authenticated users to create applications (for testing by recruiters)
CREATE POLICY "Authenticated users can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (candidate_name IS NOT NULL AND candidate_email IS NOT NULL);