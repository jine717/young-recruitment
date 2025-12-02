-- Allow authenticated users to create business case responses (for testing by recruiters)
CREATE POLICY "Authenticated users can create business case responses"
ON public.business_case_responses
FOR INSERT
TO authenticated
WITH CHECK (true);