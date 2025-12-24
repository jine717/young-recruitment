-- Remove the CHECK constraint that limits question_number to 1-3
ALTER TABLE public.business_cases 
DROP CONSTRAINT IF EXISTS business_cases_question_number_check;