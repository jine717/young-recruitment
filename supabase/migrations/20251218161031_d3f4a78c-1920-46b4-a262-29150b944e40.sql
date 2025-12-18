-- Add new application status values
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'bcq_received' AFTER 'bcq_sent';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'pre_interview' AFTER 'bcq_received';

-- Add columns to preserve scores before BCQ analysis in ai_evaluations
ALTER TABLE ai_evaluations ADD COLUMN IF NOT EXISTS pre_bcq_overall_score INTEGER;
ALTER TABLE ai_evaluations ADD COLUMN IF NOT EXISTS pre_bcq_skills_match_score INTEGER;
ALTER TABLE ai_evaluations ADD COLUMN IF NOT EXISTS pre_bcq_communication_score INTEGER;
ALTER TABLE ai_evaluations ADD COLUMN IF NOT EXISTS pre_bcq_cultural_fit_score INTEGER;
ALTER TABLE ai_evaluations ADD COLUMN IF NOT EXISTS pre_bcq_recommendation TEXT;