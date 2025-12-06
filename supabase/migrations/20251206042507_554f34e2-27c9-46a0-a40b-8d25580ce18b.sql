-- Drop existing constraint on document_type
ALTER TABLE document_analyses DROP CONSTRAINT IF EXISTS document_analyses_document_type_check;

-- Add updated constraint with 'interview' included
ALTER TABLE document_analyses ADD CONSTRAINT document_analyses_document_type_check 
  CHECK (document_type = ANY (ARRAY['cv'::text, 'disc'::text, 'interview'::text]));