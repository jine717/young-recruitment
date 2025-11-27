-- Create enum for AI recommendation
CREATE TYPE public.ai_recommendation AS ENUM ('proceed', 'review', 'reject');

-- Create enum for AI evaluation status
CREATE TYPE public.ai_evaluation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create ai_evaluations table
CREATE TABLE public.ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  summary TEXT,
  strengths TEXT[] DEFAULT '{}',
  concerns TEXT[] DEFAULT '{}',
  recommendation ai_recommendation,
  cultural_fit_score INTEGER CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
  skills_match_score INTEGER CHECK (skills_match_score >= 0 AND skills_match_score <= 100),
  communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add AI columns to applications table
ALTER TABLE public.applications 
ADD COLUMN ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
ADD COLUMN ai_evaluation_status ai_evaluation_status DEFAULT 'pending';

-- Enable RLS on ai_evaluations
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS: Recruiters and admins can view all evaluations
CREATE POLICY "Recruiters and admins can view ai evaluations"
ON public.ai_evaluations
FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- RLS: System can insert/update (via service role in edge function)
CREATE POLICY "Service role can manage ai evaluations"
ON public.ai_evaluations
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);