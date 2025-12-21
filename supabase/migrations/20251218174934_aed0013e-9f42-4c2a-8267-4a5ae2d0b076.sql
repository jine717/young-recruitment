-- Drop the existing check constraint and add a new one with 'final_evaluation' included
ALTER TABLE public.document_analyses 
DROP CONSTRAINT IF EXISTS document_analyses_document_type_check;

ALTER TABLE public.document_analyses 
ADD CONSTRAINT document_analyses_document_type_check 
CHECK (document_type IN ('cv', 'disc', 'interview', 'post_bcq_analysis', 'final_evaluation'));