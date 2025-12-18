-- Allow recruiters and admins to update business case responses (for transcription, analysis, etc.)
CREATE POLICY "Recruiters and admins can update business case responses"
ON public.business_case_responses
FOR UPDATE
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));