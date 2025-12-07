-- Add LinkedIn tracking fields to jobs table
ALTER TABLE public.jobs
ADD COLUMN linkedin_post_status text NOT NULL DEFAULT 'not_posted',
ADD COLUMN linkedin_posted_at timestamp with time zone,
ADD COLUMN linkedin_post_content text,
ADD COLUMN linkedin_posted_by uuid;

-- Add check constraint for valid status values
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_linkedin_post_status_check 
CHECK (linkedin_post_status IN ('not_posted', 'draft', 'posted'));