-- Allow anonymous users to read business case responses
-- This is required for upsert operations which need SELECT to check existence
CREATE POLICY "Anon can read business case responses"
ON public.business_case_responses
FOR SELECT
TO anon
USING (true);