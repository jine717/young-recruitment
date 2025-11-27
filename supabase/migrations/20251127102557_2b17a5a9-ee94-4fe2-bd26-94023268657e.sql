-- Create business_cases table
CREATE TABLE public.business_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 3),
  question_title TEXT NOT NULL,
  question_description TEXT NOT NULL,
  video_url TEXT,
  has_text_response BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, question_number)
);

-- Create business_case_responses table
CREATE TABLE public.business_case_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  business_case_id UUID NOT NULL REFERENCES public.business_cases(id) ON DELETE CASCADE,
  video_url TEXT,
  text_response TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, business_case_id)
);

-- Add business case tracking columns to applications
ALTER TABLE public.applications 
ADD COLUMN business_case_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN business_case_completed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.business_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_case_responses ENABLE ROW LEVEL SECURITY;

-- RLS for business_cases (public read for published jobs, admin/recruiter manage)
CREATE POLICY "Business cases viewable for published jobs"
ON public.business_cases FOR SELECT
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = business_cases.job_id AND jobs.status = 'published'));

CREATE POLICY "Recruiters and admins can manage business cases"
ON public.business_cases FOR ALL
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- RLS for business_case_responses
CREATE POLICY "Candidates can view their own responses"
ON public.business_case_responses FOR SELECT
USING (EXISTS (SELECT 1 FROM public.applications WHERE applications.id = business_case_responses.application_id AND applications.candidate_id = auth.uid()));

CREATE POLICY "Candidates can create their own responses"
ON public.business_case_responses FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE applications.id = business_case_responses.application_id AND applications.candidate_id = auth.uid()));

CREATE POLICY "Candidates can update their own responses"
ON public.business_case_responses FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.applications WHERE applications.id = business_case_responses.application_id AND applications.candidate_id = auth.uid()));

CREATE POLICY "Recruiters and admins can view all responses"
ON public.business_case_responses FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Create storage bucket for business case videos
INSERT INTO storage.buckets (id, name, public) VALUES ('business-case-videos', 'business-case-videos', false);

-- Storage policies
CREATE POLICY "Candidates can upload business case videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-case-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates can view their own business case videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-case-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruiters and admins can view all business case videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-case-videos' AND (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin')));

-- Trigger for updated_at
CREATE TRIGGER update_business_cases_updated_at
BEFORE UPDATE ON public.business_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sample business case questions for existing jobs
INSERT INTO public.business_cases (job_id, question_number, question_title, question_description, has_text_response)
SELECT 
  j.id,
  q.question_number,
  q.question_title,
  q.question_description,
  q.has_text_response
FROM public.jobs j
CROSS JOIN (
  VALUES 
    (1, 'Problem Solving', 'Describe a challenging situation you faced and how you solved it. What was the outcome?', true),
    (2, 'Team Collaboration', 'Tell us about a time you worked with a difficult team member. How did you handle it?', true),
    (3, 'Innovation', 'Present an innovative idea that could improve our industry. Explain your reasoning.', false)
) AS q(question_number, question_title, question_description, has_text_response)
WHERE j.status = 'published';