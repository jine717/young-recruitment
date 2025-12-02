-- Add unique constraint to prevent duplicate applications with same email for the same job
ALTER TABLE public.applications 
ADD CONSTRAINT applications_job_email_unique UNIQUE (job_id, candidate_email);