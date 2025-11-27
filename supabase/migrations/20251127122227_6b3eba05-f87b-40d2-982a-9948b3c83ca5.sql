-- Create interview type enum
CREATE TYPE interview_type AS ENUM ('phone', 'video', 'in_person');

-- Create interview status enum
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  scheduled_by UUID NOT NULL,
  interview_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  interview_type interview_type NOT NULL DEFAULT 'video',
  location TEXT,
  meeting_link TEXT,
  notes_for_candidate TEXT,
  internal_notes TEXT,
  status interview_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Recruiters and admins can view all interviews"
ON public.interviews FOR SELECT
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can create interviews"
ON public.interviews FOR INSERT
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can update interviews"
ON public.interviews FOR UPDATE
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can delete interviews"
ON public.interviews FOR DELETE
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Candidates can view their own interviews"
ON public.interviews FOR SELECT
USING (EXISTS (
  SELECT 1 FROM applications 
  WHERE applications.id = interviews.application_id 
  AND applications.candidate_id = auth.uid()
));

-- Create updated_at trigger
CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();