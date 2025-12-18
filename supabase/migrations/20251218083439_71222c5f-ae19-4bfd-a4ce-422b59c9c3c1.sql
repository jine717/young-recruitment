-- Allow anonymous users to UPDATE (overwrite) business case videos.
-- Required because client uploads use { upsert: true } which performs UPDATE if the object already exists.

DROP POLICY IF EXISTS "Anon can update business case videos" ON storage.objects;

CREATE POLICY "Anon can update business case videos"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'business-case-videos')
WITH CHECK (bucket_id = 'business-case-videos');
