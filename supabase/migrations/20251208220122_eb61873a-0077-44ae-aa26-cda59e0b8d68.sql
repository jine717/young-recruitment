-- Add created_by column to jobs table
ALTER TABLE public.jobs ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Create index for efficient queries
CREATE INDEX idx_jobs_created_by ON public.jobs(created_by);