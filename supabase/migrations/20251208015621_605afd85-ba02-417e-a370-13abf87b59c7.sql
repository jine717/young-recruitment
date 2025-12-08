-- Add assigned_to column to applications table
ALTER TABLE public.applications 
ADD COLUMN assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_applications_assigned_to ON public.applications(assigned_to);

-- RLS policy already allows recruiters/admins to update applications, so assigned_to is covered