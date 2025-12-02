-- Allow authenticated users to upload CVs to anonymous folder
CREATE POLICY "Authenticated users can upload anonymous CVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' 
  AND (storage.foldername(name))[1] = 'anonymous'
);

-- Allow authenticated users to upload DISC to anonymous folder  
CREATE POLICY "Authenticated users can upload anonymous DISC"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'disc-assessments'
  AND (storage.foldername(name))[1] = 'anonymous'
);