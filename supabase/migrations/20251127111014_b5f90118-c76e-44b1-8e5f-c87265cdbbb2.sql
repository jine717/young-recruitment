-- Create notification_logs table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view notification logs
CREATE POLICY "Recruiters and admins can view notification logs"
ON public.notification_logs
FOR SELECT
USING (has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage notification logs (for edge function)
CREATE POLICY "Service role can manage notification logs"
ON public.notification_logs
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_notification_logs_application_id ON public.notification_logs(application_id);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);