-- Make business-case-videos bucket public so video URLs work correctly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'business-case-videos';