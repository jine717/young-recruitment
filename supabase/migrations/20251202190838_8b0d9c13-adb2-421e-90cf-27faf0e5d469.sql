-- Add recruiter_note column to interview_questions table
ALTER TABLE public.interview_questions 
ADD COLUMN recruiter_note text;