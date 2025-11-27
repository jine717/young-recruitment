
-- Create enums for evaluation recommendation and hiring decision
CREATE TYPE public.interview_recommendation AS ENUM ('strong_hire', 'hire', 'no_hire', 'strong_no_hire');
CREATE TYPE public.hiring_decision_type AS ENUM ('hired', 'rejected', 'on_hold');

-- Create interview_evaluations table
CREATE TABLE public.interview_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  technical_score INTEGER CHECK (technical_score >= 1 AND technical_score <= 5),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  cultural_fit_score INTEGER CHECK (cultural_fit_score >= 1 AND cultural_fit_score <= 5),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 1 AND problem_solving_score <= 5),
  overall_impression TEXT,
  strengths TEXT[] DEFAULT '{}'::text[],
  areas_for_improvement TEXT[] DEFAULT '{}'::text[],
  recommendation interview_recommendation,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hiring_decisions table
CREATE TABLE public.hiring_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  decision hiring_decision_type NOT NULL,
  decision_maker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reasoning TEXT NOT NULL,
  salary_offered TEXT,
  start_date DATE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_evaluations
CREATE POLICY "Recruiters and admins can view evaluations"
ON public.interview_evaluations FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can create evaluations"
ON public.interview_evaluations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Evaluators can update their own evaluations"
ON public.interview_evaluations FOR UPDATE
USING (evaluator_id = auth.uid() AND (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Evaluators can delete their own evaluations"
ON public.interview_evaluations FOR DELETE
USING (evaluator_id = auth.uid() AND (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin')));

-- RLS Policies for hiring_decisions
CREATE POLICY "Recruiters and admins can view decisions"
ON public.hiring_decisions FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can create decisions"
ON public.hiring_decisions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_interview_evaluations_updated_at
BEFORE UPDATE ON public.interview_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
