-- Make business-case-videos bucket private for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'business-case-videos';

-- Drop existing policies for business-case-videos if they exist, then recreate
DROP POLICY IF EXISTS "Anyone can upload business case videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can access business case videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can update business case videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can delete business case videos" ON storage.objects;

-- Allow authenticated users with recruiter/admin/management roles to access videos
CREATE POLICY "Authenticated staff can access business case videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'business-case-videos' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'recruiter') 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'management')
  )
);

-- Allow anyone to upload to business-case-videos (candidates via BCQ portal)
CREATE POLICY "Anyone can upload business case videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'business-case-videos');

-- Allow authenticated staff to update videos
CREATE POLICY "Authenticated staff can update business case videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'business-case-videos' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'recruiter') 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'management')
  )
);

-- Allow authenticated staff to delete videos
CREATE POLICY "Authenticated staff can delete business case videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'business-case-videos' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'recruiter') 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'management')
  )
);