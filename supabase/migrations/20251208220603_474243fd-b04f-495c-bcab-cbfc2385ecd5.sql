-- Drop the existing FK to auth.users and add one to profiles
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);