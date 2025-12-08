-- Allow recruiters and admins to view all recruiter and admin roles (for assignment dropdown)
CREATE POLICY "Recruiters and admins can view recruiter roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);