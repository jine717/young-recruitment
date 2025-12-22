-- Drop existing policies that may not be working correctly
DROP POLICY IF EXISTS "Anon can upload business case videos" ON storage.objects;
DROP POLICY IF EXISTS "Anon can update business case videos" ON storage.objects;

-- Create new permissive policy for INSERT
CREATE POLICY "Anyone can upload business case videos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'business-case-videos');

-- Create new permissive policy for UPDATE
CREATE POLICY "Anyone can update business case videos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'business-case-videos')
WITH CHECK (bucket_id = 'business-case-videos');