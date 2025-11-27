-- Create interview_questions table
CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL, -- 'skills_verification', 'concern_probing', 'cultural_fit', 'experience', 'motivation'
  reasoning TEXT, -- Why this question was generated
  priority INTEGER NOT NULL DEFAULT 1, -- 1=high, 2=medium, 3=low
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view interview questions
CREATE POLICY "Recruiters and admins can view interview questions"
ON public.interview_questions
FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Recruiters and admins can manage interview questions
CREATE POLICY "Recruiters and admins can manage interview questions"
ON public.interview_questions
FOR ALL
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_interview_questions_application_id ON public.interview_questions(application_id);