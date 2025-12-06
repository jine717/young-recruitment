-- Add fields to track initial (pre-interview) scores and evaluation stage
ALTER TABLE ai_evaluations 
  ADD COLUMN IF NOT EXISTS initial_overall_score integer,
  ADD COLUMN IF NOT EXISTS initial_skills_match_score integer,
  ADD COLUMN IF NOT EXISTS initial_communication_score integer,
  ADD COLUMN IF NOT EXISTS initial_cultural_fit_score integer,
  ADD COLUMN IF NOT EXISTS initial_recommendation text,
  ADD COLUMN IF NOT EXISTS evaluation_stage text DEFAULT 'initial';

-- Add check constraint for evaluation_stage
ALTER TABLE ai_evaluations 
  ADD CONSTRAINT ai_evaluations_evaluation_stage_check 
  CHECK (evaluation_stage IN ('initial', 'post_interview'));