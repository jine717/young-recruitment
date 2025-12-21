-- Allow anonymous users to upload to business-case-videos bucket
CREATE POLICY "Anon can upload business case videos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'business-case-videos');

-- Allow anonymous users to read their uploaded videos (for playback preview)
CREATE POLICY "Anon can read business case videos"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'business-case-videos');