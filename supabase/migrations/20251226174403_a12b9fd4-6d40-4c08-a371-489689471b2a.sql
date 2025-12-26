-- Create funnel_events table for tracking candidate journey
CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  user_agent text,
  referrer text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_funnel_events_job_id ON public.funnel_events(job_id);
CREATE INDEX idx_funnel_events_type ON public.funnel_events(event_type);
CREATE INDEX idx_funnel_events_created ON public.funnel_events(created_at);
CREATE INDEX idx_funnel_events_session ON public.funnel_events(session_id);

-- Enable Row Level Security
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert events (candidates are not authenticated)
CREATE POLICY "Anon can insert funnel events" 
ON public.funnel_events 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow authenticated users to insert events
CREATE POLICY "Authenticated can insert funnel events" 
ON public.funnel_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Recruiters, admins, and management can view funnel events
CREATE POLICY "Recruiters admins management can view funnel events" 
ON public.funnel_events 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role)
);