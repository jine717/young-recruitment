-- Remove outdated storage RLS policies that rely on auth.uid() for BCQ videos.
-- BCQ portal is token-based and candidates are anonymous.

DROP POLICY IF EXISTS "Candidates can upload business case videos" ON storage.objects;
DROP POLICY IF EXISTS "Candidates can view their own business case videos" ON storage.objects;
