-- Drop the existing check constraint on evaluation_stage
ALTER TABLE ai_evaluations DROP CONSTRAINT IF EXISTS ai_evaluations_evaluation_stage_check;

-- Add updated check constraint that includes 'post_bcq'
ALTER TABLE ai_evaluations ADD CONSTRAINT ai_evaluations_evaluation_stage_check 
  CHECK (evaluation_stage IN ('initial', 'post_bcq', 'post_interview'));