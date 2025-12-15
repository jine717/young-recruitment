-- Management can view all applications
CREATE POLICY "Management can view all applications" 
ON public.applications 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view ai evaluations
CREATE POLICY "Management can view ai evaluations" 
ON public.ai_evaluations 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view all interviews
CREATE POLICY "Management can view all interviews" 
ON public.interviews 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view interview evaluations
CREATE POLICY "Management can view interview evaluations" 
ON public.interview_evaluations 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view hiring decisions
CREATE POLICY "Management can view hiring decisions" 
ON public.hiring_decisions 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view recruiter notes
CREATE POLICY "Management can view recruiter notes" 
ON public.recruiter_notes 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view comparisons
CREATE POLICY "Management can view comparisons" 
ON public.candidate_comparisons 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view document analyses
CREATE POLICY "Management can view document analyses" 
ON public.document_analyses 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view notification logs
CREATE POLICY "Management can view notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view interview questions
CREATE POLICY "Management can view interview questions" 
ON public.interview_questions 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view fixed question notes
CREATE POLICY "Management can view fixed question notes" 
ON public.fixed_question_notes 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view all jobs
CREATE POLICY "Management can view all jobs" 
ON public.jobs 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view all profiles
CREATE POLICY "Management can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view user roles
CREATE POLICY "Management can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view ai templates
CREATE POLICY "Management can view ai templates" 
ON public.ai_evaluation_templates 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view business cases
CREATE POLICY "Management can view business cases" 
ON public.business_cases 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view business case responses
CREATE POLICY "Management can view business case responses" 
ON public.business_case_responses 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));

-- Management can view fixed questions
CREATE POLICY "Management can view fixed questions" 
ON public.job_fixed_questions 
FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role));