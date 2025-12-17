-- Add fluency analysis columns to business_case_responses table
ALTER TABLE public.business_case_responses 
ADD COLUMN IF NOT EXISTS fluency_pronunciation_score INTEGER,
ADD COLUMN IF NOT EXISTS fluency_pace_score INTEGER,
ADD COLUMN IF NOT EXISTS fluency_hesitation_score INTEGER,
ADD COLUMN IF NOT EXISTS fluency_grammar_score INTEGER,
ADD COLUMN IF NOT EXISTS fluency_overall_score INTEGER,
ADD COLUMN IF NOT EXISTS fluency_notes TEXT;