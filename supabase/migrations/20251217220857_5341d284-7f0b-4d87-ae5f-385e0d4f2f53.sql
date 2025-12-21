-- Add columns for BCQ response content analysis
ALTER TABLE business_case_responses 
ADD COLUMN IF NOT EXISTS content_quality_score INTEGER,
ADD COLUMN IF NOT EXISTS content_strengths TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_areas_to_probe TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_summary TEXT,
ADD COLUMN IF NOT EXISTS content_analysis_status TEXT DEFAULT 'pending';