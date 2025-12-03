-- Add AI system prompt column for custom evaluation instructions
ALTER TABLE public.jobs 
ADD COLUMN ai_system_prompt text;

COMMENT ON COLUMN public.jobs.ai_system_prompt IS 
'Custom instructions for AI candidate evaluation. Used as additional context in the analyze-candidate function.';