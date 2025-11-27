-- Create enums
CREATE TYPE public.job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'under_review', 'interview', 'rejected', 'hired');
CREATE TYPE public.app_role AS ENUM ('candidate', 'recruiter', 'admin');

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  type job_type NOT NULL DEFAULT 'full-time',
  description TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status job_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cv_url TEXT,
  disc_url TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- Assign candidate role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'candidate');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for departments (public read)
CREATE POLICY "Departments are viewable by everyone"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jobs
CREATE POLICY "Published jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (status = 'published');

CREATE POLICY "Recruiters and admins can view all jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can manage jobs"
  ON public.jobs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Recruiters and admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (read-only via function)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for applications
CREATE POLICY "Candidates can view their own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can create applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Recruiters and admins can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters and admins can update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('disc-assessments', 'disc-assessments', false);

-- Storage policies for CVs
CREATE POLICY "Users can upload their own CV"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CV"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruiters can view all CVs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cvs' AND (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin')));

-- Storage policies for DISC assessments
CREATE POLICY "Users can upload their own DISC"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'disc-assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own DISC"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'disc-assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruiters can view all DISC assessments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'disc-assessments' AND (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin')));

-- Insert initial departments
INSERT INTO public.departments (name) VALUES 
  ('Marketing'),
  ('Operations'),
  ('Technology'),
  ('Sales'),
  ('Human Resources');

-- Insert sample published jobs
INSERT INTO public.jobs (title, department_id, location, type, description, responsibilities, requirements, benefits, tags, status)
SELECT 
  'GROWTH MARKETING MANAGER',
  d.id,
  'Amsterdam, NL',
  'full-time',
  'Drive our marketing initiatives and help scale our client acquisition strategies. You''ll work directly with founders and clients to create impactful campaigns.',
  ARRAY['Develop and execute marketing strategies', 'Manage paid advertising campaigns', 'Analyze marketing metrics and ROI', 'Collaborate with creative team on content', 'Build and optimize conversion funnels'],
  ARRAY['3+ years of marketing experience', 'Experience with paid social and Google Ads', 'Strong analytical skills', 'Excellent communication abilities', 'Portfolio of successful campaigns'],
  ARRAY['Competitive salary + performance bonus', 'Flexible working hours', 'Remote-first culture', 'Learning & development budget', 'Team retreats'],
  ARRAY['Marketing', 'Growth', 'Remote-Friendly'],
  'published'
FROM public.departments d WHERE d.name = 'Marketing';

INSERT INTO public.jobs (title, department_id, location, type, description, responsibilities, requirements, benefits, tags, status)
SELECT 
  'OPERATIONS ASSOCIATE',
  d.id,
  'Rotterdam, NL',
  'full-time',
  'Support our operations team in delivering exceptional service to our clients. You''ll be the backbone of our day-to-day activities.',
  ARRAY['Coordinate project timelines and deliverables', 'Manage client communications', 'Optimize operational processes', 'Support team with administrative tasks', 'Track and report on KPIs'],
  ARRAY['1-2 years of operations experience', 'Strong organizational skills', 'Proficiency in project management tools', 'Detail-oriented mindset', 'Fluent in English and Dutch'],
  ARRAY['Competitive salary', 'Health insurance', 'Pension plan', 'Professional development', 'Startup environment'],
  ARRAY['Operations', 'Entry-Level', 'On-Site'],
  'published'
FROM public.departments d WHERE d.name = 'Operations';

INSERT INTO public.jobs (title, department_id, location, type, description, responsibilities, requirements, benefits, tags, status)
SELECT 
  'FULL-STACK DEVELOPER',
  d.id,
  'Remote',
  'full-time',
  'Build and maintain our digital products. Work with modern technologies and shape the future of recruitment tech.',
  ARRAY['Develop features using React and Node.js', 'Design and implement APIs', 'Write clean, maintainable code', 'Participate in code reviews', 'Collaborate with design team'],
  ARRAY['3+ years full-stack experience', 'Strong TypeScript skills', 'Experience with React and Next.js', 'Database design knowledge', 'CI/CD experience'],
  ARRAY['Top-tier salary', 'Stock options', 'Fully remote', 'Latest equipment', 'Conference budget'],
  ARRAY['Tech', 'Remote', 'Senior'],
  'published'
FROM public.departments d WHERE d.name = 'Technology';