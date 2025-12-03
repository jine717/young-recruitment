-- Create AI evaluation templates table
CREATE TABLE public.ai_evaluation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  prompt_content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE public.ai_evaluation_templates ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view all templates
CREATE POLICY "Recruiters and admins can view templates"
  ON public.ai_evaluation_templates FOR SELECT
  USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Recruiters and admins can create templates
CREATE POLICY "Recruiters and admins can create templates"
  ON public.ai_evaluation_templates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Users can update their own templates (or admins can update any)
CREATE POLICY "Users can update own templates or admins any"
  ON public.ai_evaluation_templates FOR UPDATE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Users can delete their own templates (or admins can delete any)
CREATE POLICY "Users can delete own templates or admins any"
  ON public.ai_evaluation_templates FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_ai_evaluation_templates_updated_at
  BEFORE UPDATE ON public.ai_evaluation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some starter templates
INSERT INTO public.ai_evaluation_templates (name, description, prompt_content) VALUES
('Technical Role Focus', 'Emphasis on technical skills and problem-solving', 
 'Focus heavily on technical competency and hands-on experience. Evaluate coding skills, system design thinking, and ability to explain complex concepts. Look for evidence of continuous learning and passion for technology.'),
('Leadership Position', 'For management and leadership roles',
 'Prioritize leadership experience, team management skills, and strategic thinking. Look for examples of conflict resolution, team development, and decision-making under pressure. Evaluate communication style and executive presence.'),
('Customer-Facing Role', 'For sales, support, and client roles',
 'Emphasize communication skills, empathy, and client relationship experience. Look for patience, problem-solving in customer contexts, and ability to handle difficult situations professionally.'),
('Startup Culture Fit', 'For fast-paced startup environments',
 'Prioritize adaptability, self-motivation, and willingness to wear multiple hats. Look for entrepreneurial mindset, comfort with ambiguity, and evidence of initiative in previous roles.'),
('Entry-Level/Junior', 'For candidates with limited experience',
 'Focus on potential rather than experience. Evaluate learning ability, enthusiasm, educational background, and transferable skills. Look for growth mindset and coachability.');