-- Add auditor columns to review_progress table
ALTER TABLE public.review_progress
ADD COLUMN IF NOT EXISTS ai_reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ai_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cv_reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cv_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS disc_reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS disc_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS business_case_reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS business_case_reviewed_at timestamp with time zone;

-- Drop the old restrictive UPDATE policy
DROP POLICY IF EXISTS "Recruiters and admins can update their own review progress" ON public.review_progress;

-- Create new UPDATE policy that allows any recruiter/admin to update any review progress
CREATE POLICY "Recruiters and admins can update review progress"
ON public.review_progress
FOR UPDATE
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add unique constraint on application_id to ensure only one review_progress per application
-- First, we need to handle potential duplicates by keeping only one record per application
DELETE FROM public.review_progress a
USING public.review_progress b
WHERE a.application_id = b.application_id
AND a.id < b.id;

-- Now add the unique constraint
ALTER TABLE public.review_progress
DROP CONSTRAINT IF EXISTS review_progress_application_id_unique;

ALTER TABLE public.review_progress
ADD CONSTRAINT review_progress_application_id_unique UNIQUE (application_id);