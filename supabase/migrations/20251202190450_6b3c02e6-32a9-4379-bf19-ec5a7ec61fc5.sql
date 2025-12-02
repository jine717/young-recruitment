-- Allow recruiters and admins to delete applications
CREATE POLICY "Recruiters and admins can delete applications" 
ON public.applications 
FOR DELETE 
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
