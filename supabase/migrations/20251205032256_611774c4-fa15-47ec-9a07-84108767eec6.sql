-- Create table for fixed interview questions per job vacancy
CREATE TABLE public.job_fixed_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority INTEGER NOT NULL DEFAULT 2,
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_fixed_questions ENABLE ROW LEVEL SECURITY;

-- RLS: Recruiters and admins can manage fixed questions
CREATE POLICY "Recruiters and admins can manage fixed questions" 
ON public.job_fixed_questions
FOR ALL 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- RLS: Fixed questions viewable for published jobs (for consistency)
CREATE POLICY "Fixed questions viewable for published jobs" 
ON public.job_fixed_questions
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs WHERE jobs.id = job_fixed_questions.job_id AND jobs.status = 'published'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_fixed_questions_updated_at
BEFORE UPDATE ON public.job_fixed_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();