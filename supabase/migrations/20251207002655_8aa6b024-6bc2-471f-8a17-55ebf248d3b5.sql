
-- Create 3 test candidates for Full-Stack Developer job
-- Job ID: 48566662-34d8-4f34-97a4-5cb6d9901ef4

-- Candidate 1: Carlos Mendez (Senior, high score)
INSERT INTO public.applications (id, job_id, candidate_name, candidate_email, status, ai_score, ai_evaluation_status, business_case_completed, business_case_completed_at, cv_url, disc_url)
VALUES (
  'a1111111-1111-4111-a111-111111111111',
  '48566662-34d8-4f34-97a4-5cb6d9901ef4',
  'Carlos Mendez',
  'carlos.mendez@example.com',
  'interview',
  87,
  'completed',
  true,
  now() - interval '2 days',
  'test/carlos_cv.pdf',
  'test/carlos_disc.pdf'
);

-- Candidate 2: Sofia Rodriguez (Mid-level, medium score)
INSERT INTO public.applications (id, job_id, candidate_name, candidate_email, status, ai_score, ai_evaluation_status, business_case_completed, business_case_completed_at, cv_url, disc_url)
VALUES (
  'a2222222-2222-4222-a222-222222222222',
  '48566662-34d8-4f34-97a4-5cb6d9901ef4',
  'Sofia Rodriguez',
  'sofia.rodriguez@example.com',
  'under_review',
  72,
  'completed',
  true,
  now() - interval '1 day',
  'test/sofia_cv.pdf',
  'test/sofia_disc.pdf'
);

-- Candidate 3: David Kim (Junior, lower score)
INSERT INTO public.applications (id, job_id, candidate_name, candidate_email, status, ai_score, ai_evaluation_status, business_case_completed, business_case_completed_at, cv_url, disc_url)
VALUES (
  'a3333333-3333-4333-a333-333333333333',
  '48566662-34d8-4f34-97a4-5cb6d9901ef4',
  'David Kim',
  'david.kim@example.com',
  'pending',
  58,
  'completed',
  true,
  now(),
  'test/david_cv.pdf',
  'test/david_disc.pdf'
);

-- Document Analyses for Carlos (CV)
INSERT INTO public.document_analyses (id, application_id, document_type, status, summary, analysis)
VALUES (
  'd1111111-1111-4111-a111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'cv',
  'completed',
  'Senior Full-Stack Developer with 8+ years experience in React, Node.js, and cloud technologies. Strong leadership background with proven track record of delivering complex projects.',
  '{"candidate_summary": "Highly experienced senior developer with deep expertise in modern web technologies and team leadership.", "experience_years": 8, "key_skills": ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker", "Kubernetes", "GraphQL"], "education": [{"degree": "M.S. Computer Science", "institution": "Stanford University", "year": "2016"}], "work_history": [{"company": "TechCorp Inc.", "role": "Senior Full-Stack Developer", "duration": "2020-Present"}, {"company": "StartupXYZ", "role": "Full-Stack Developer", "duration": "2017-2020"}], "strengths": ["Strong technical leadership", "Excellent problem-solving", "Microservices architecture expertise", "Mentoring experience"], "red_flags": [], "overall_impression": "Exceptional candidate with comprehensive full-stack experience and leadership qualities."}'::jsonb
);

-- Document Analyses for Carlos (DISC)
INSERT INTO public.document_analyses (id, application_id, document_type, status, summary, analysis)
VALUES (
  'd1111112-1111-4111-a111-111111111112',
  'a1111111-1111-4111-a111-111111111111',
  'disc',
  'completed',
  'D-type personality with strong leadership drive and results-oriented approach.',
  '{"profile_type": "D", "profile_description": "Dominant personality type focused on results and direct action.", "dominant_traits": ["Decisive", "Competitive", "Results-oriented", "Independent"], "communication_style": "Direct, concise, and focused on outcomes.", "work_style": "Takes charge of projects, sets ambitious goals.", "strengths": ["Natural leadership", "Quick decision-making", "Handles pressure well"], "potential_challenges": ["May overlook details", "Can be impatient"], "management_tips": "Give autonomy and clear objectives.", "team_fit_considerations": "Works best in leadership roles."}'::jsonb
);

-- Document Analyses for Sofia (CV)
INSERT INTO public.document_analyses (id, application_id, document_type, status, summary, analysis)
VALUES (
  'd2222221-2222-4222-a222-222222222221',
  'a2222222-2222-4222-a222-222222222222',
  'cv',
  'completed',
  'Mid-level Full-Stack Developer with 4 years experience. Strong Python/Django background transitioning to React.',
  '{"candidate_summary": "Solid mid-level developer with backend strength and growing frontend expertise.", "experience_years": 4, "key_skills": ["Python", "Django", "React", "PostgreSQL", "REST APIs", "Git"], "education": [{"degree": "B.S. Software Engineering", "institution": "UC Berkeley", "year": "2020"}], "work_history": [{"company": "DataFlow Systems", "role": "Full-Stack Developer", "duration": "2022-Present"}, {"company": "CloudTech", "role": "Backend Developer", "duration": "2020-2022"}], "strengths": ["Strong backend fundamentals", "API design", "Team collaboration"], "red_flags": ["Limited React experience"], "overall_impression": "Promising mid-level candidate with solid fundamentals."}'::jsonb
);

-- Document Analyses for Sofia (DISC)
INSERT INTO public.document_analyses (id, application_id, document_type, status, summary, analysis)
VALUES (
  'd2222222-2222-4222-a222-222222222222',
  'a2222222-2222-4222-a222-222222222222',
  'disc',
  'completed',
  'I-type personality with excellent interpersonal skills and enthusiasm.',
  '{"profile_type": "I", "profile_description": "Influential personality type focused on collaboration.", "dominant_traits": ["Enthusiastic", "Collaborative", "Optimistic"], "communication_style": "Warm, engaging, and expressive.", "work_style": "Thrives in collaborative environments.", "strengths": ["Team building", "Creative problem-solving", "Adaptable"], "potential_challenges": ["May overcommit", "Can lose focus on details"], "management_tips": "Provide social recognition and clear milestones.", "team_fit_considerations": "Excellent team player."}'::jsonb
);

-- Document Analyses for David (CV)
INSERT INTO public.document_analyses (id, application_id, document_type, status, summary, analysis)
VALUES (
  'd3333331-3333-4333-a333-333333333331',
  'a3333333-3333-4333-a333-333333333333',
  'cv',
  'completed',
  'Junior developer with 1.5 years experience. Bootcamp graduate showing strong learning trajectory.',
  '{"candidate_summary": "Entry-level developer with bootcamp training and growing experience.", "experience_years": 1.5, "key_skills": ["JavaScript", "React", "Node.js", "MongoDB", "HTML/CSS", "Git"], "education": [{"degree": "Full-Stack Development Certificate", "institution": "Coding Bootcamp Pro", "year": "2023"}], "work_history": [{"company": "LocalStartup", "role": "Junior Developer", "duration": "2023-Present"}], "strengths": ["Fast learner", "Modern tech stack", "Enthusiasm"], "red_flags": ["Limited professional experience", "No CS degree"], "overall_impression": "Promising junior with potential but requires investment."}'::jsonb
);

-- Document Analyses for David (DISC)
INSERT INTO public.document_analyses (id, application_id, document_type, status, summary, analysis)
VALUES (
  'd3333332-3333-4333-a333-333333333332',
  'a3333333-3333-4333-a333-333333333333',
  'disc',
  'completed',
  'S-type personality with steady, supportive nature. Reliable team member.',
  '{"profile_type": "S", "profile_description": "Steady personality type focused on stability.", "dominant_traits": ["Patient", "Reliable", "Supportive"], "communication_style": "Calm, patient, and attentive.", "work_style": "Methodical approach with attention to quality.", "strengths": ["Dependable", "Team-oriented", "Thorough"], "potential_challenges": ["May resist rapid change", "Hesitant to voice concerns"], "management_tips": "Provide stable environment and consistent feedback.", "team_fit_considerations": "Excellent support role."}'::jsonb
);

-- Business Case Responses for Carlos
INSERT INTO public.business_case_responses (application_id, business_case_id, text_response, completed_at)
SELECT 
  'a1111111-1111-4111-a111-111111111111',
  bc.id,
  CASE bc.question_number
    WHEN 1 THEN 'I would approach this by first conducting a thorough analysis of the legacy codebase, identifying critical dependencies. My strategy involves creating a comprehensive testing suite before migration, implementing a strangler fig pattern to gradually replace legacy components. I led similar migrations at TechCorp where we reduced technical debt by 60% while maintaining 99.9% uptime.'
    WHEN 2 THEN 'For team collaboration, I establish clear communication channels and shared ownership. I implement pair programming sessions, regular code reviews with constructive feedback, and knowledge-sharing sessions. In my current role, I mentor two junior developers and have seen significant improvement in their code quality.'
    ELSE 'When facing tight deadlines with conflicting priorities, I use a weighted scoring matrix considering business impact and technical dependencies. I communicate transparently with stakeholders about trade-offs. At StartupXYZ, we delivered core features in half the expected time by focusing on MVP scope and iterative delivery.'
  END,
  now() - interval '2 days'
FROM public.business_cases bc
WHERE bc.job_id = '48566662-34d8-4f34-97a4-5cb6d9901ef4';

-- Business Case Responses for Sofia
INSERT INTO public.business_case_responses (application_id, business_case_id, text_response, completed_at)
SELECT 
  'a2222222-2222-4222-a222-222222222222',
  bc.id,
  CASE bc.question_number
    WHEN 1 THEN 'My approach would be to start with a detailed audit of the existing system, documenting all integrations and data flows. I would propose a phased migration plan with clear milestones and testing checkpoints at each phase. I have experience migrating Django monoliths to microservices.'
    WHEN 2 THEN 'I value open communication and believe in creating a supportive team environment. I organize regular sync meetings, encourage asking questions without judgment, and share learning resources with teammates. Collaboration tools and pair programming help build team cohesion.'
    ELSE 'I prioritize tasks based on business value and technical dependencies using agile methodologies. I break down large tasks into smaller deliverables and maintain transparent communication about progress and blockers. If conflicts arise, I escalate early with proposed solutions.'
  END,
  now() - interval '1 day'
FROM public.business_cases bc
WHERE bc.job_id = '48566662-34d8-4f34-97a4-5cb6d9901ef4';

-- Business Case Responses for David
INSERT INTO public.business_case_responses (application_id, business_case_id, text_response, completed_at)
SELECT 
  'a3333333-3333-4333-a333-333333333333',
  bc.id,
  CASE bc.question_number
    WHEN 1 THEN 'I would research best practices for legacy migrations and consult with senior team members. I understand the importance of testing and would focus on learning the existing codebase thoroughly before making changes. I am eager to learn and would document my findings.'
    WHEN 2 THEN 'I believe in being a good team player and always willing to help others. I would ask questions when unsure and offer assistance when colleagues are struggling. I think communication is key and prefer to over-communicate rather than make assumptions.'
    ELSE 'I would make a list of all tasks and estimate the effort required for each. I would communicate honestly about what is achievable and ask for help prioritizing if needed. I am still developing my project management skills but understand the importance of realistic expectations.'
  END,
  now()
FROM public.business_cases bc
WHERE bc.job_id = '48566662-34d8-4f34-97a4-5cb6d9901ef4';

-- AI Evaluations for Carlos (high score, post-interview)
INSERT INTO public.ai_evaluations (id, application_id, overall_score, skills_match_score, communication_score, cultural_fit_score, summary, strengths, concerns, recommendation, evaluation_stage, initial_overall_score, initial_skills_match_score, initial_communication_score, initial_cultural_fit_score, initial_recommendation)
VALUES (
  'e1111111-1111-4111-a111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  87, 92, 85, 84,
  'Exceptional senior candidate with comprehensive full-stack experience and proven leadership. Strong technical depth in React/Node ecosystem with cloud expertise. D-type personality indicates natural leadership abilities.',
  ARRAY['8+ years of relevant experience', 'Strong technical leadership', 'Expertise in microservices architecture', 'Proven track record of complex projects', 'Excellent problem-solving in business cases'],
  ARRAY['May require adjustment for collaborative dynamics due to D-type assertiveness', 'Senior salary expectations'],
  'proceed',
  'post_interview',
  82, 88, 80, 78, 'proceed'
);

-- AI Evaluations for Sofia (medium score)
INSERT INTO public.ai_evaluations (id, application_id, overall_score, skills_match_score, communication_score, cultural_fit_score, summary, strengths, concerns, recommendation, evaluation_stage)
VALUES (
  'e2222222-2222-4222-a222-222222222222',
  'a2222222-2222-4222-a222-222222222222',
  72, 68, 78, 75,
  'Solid mid-level candidate with strong backend fundamentals. Growing React experience shows adaptability. I-type personality excellent for team culture.',
  ARRAY['Strong Python/Django expertise', 'Good API design skills', 'Excellent team collaboration attitude', 'Positive cultural fit', 'Thoughtful problem-solving approach'],
  ARRAY['Limited React experience compared to backend', 'May need ramp-up time on frontend', 'Less cloud infrastructure experience'],
  'review',
  'initial'
);

-- AI Evaluations for David (lower score)
INSERT INTO public.ai_evaluations (id, application_id, overall_score, skills_match_score, communication_score, cultural_fit_score, summary, strengths, concerns, recommendation, evaluation_stage)
VALUES (
  'e3333333-3333-4333-a333-333333333333',
  'a3333333-3333-4333-a333-333333333333',
  58, 52, 62, 65,
  'Junior candidate with bootcamp training and limited professional experience. Shows enthusiasm and willingness to learn. S-type personality indicates reliability.',
  ARRAY['Eager to learn and grow', 'Modern tech stack familiarity', 'Reliable personality', 'Open to feedback and mentorship'],
  ARRAY['Limited professional experience (1.5 years)', 'No formal CS education', 'Would require significant mentoring investment', 'May struggle with complex architectural decisions'],
  'review',
  'initial'
);

-- Interview Questions for Carlos
INSERT INTO public.interview_questions (application_id, question_text, category, priority, reasoning, recruiter_note)
VALUES 
  ('a1111111-1111-4111-a111-111111111111', 'Describe a situation where you had to balance technical debt reduction with feature delivery.', 'Technical Leadership', 1, 'Assesses strategic technical decision-making', 'Strong answer with clear prioritization framework'),
  ('a1111111-1111-4111-a111-111111111111', 'How do you approach mentoring junior developers while maintaining productivity?', 'Team Collaboration', 2, 'Evaluates leadership capabilities', 'Provided concrete examples from current role'),
  ('a1111111-1111-4111-a111-111111111111', 'Walk through your approach to designing a scalable microservices architecture.', 'System Design', 1, 'Tests architectural thinking and depth', NULL);

-- Interview Questions for Sofia
INSERT INTO public.interview_questions (application_id, question_text, category, priority, reasoning)
VALUES 
  ('a2222222-2222-4222-a222-222222222222', 'How are you expanding your React skills and what frontend aspects excite you most?', 'Growth Mindset', 1, 'Assesses commitment to learning'),
  ('a2222222-2222-4222-a222-222222222222', 'Describe how you would optimize a slow database query in Django.', 'Technical Skills', 1, 'Tests backend expertise'),
  ('a2222222-2222-4222-a222-222222222222', 'Tell me about a time you helped resolve a team conflict.', 'Team Dynamics', 2, 'Evaluates interpersonal skills');

-- Interview Questions for David
INSERT INTO public.interview_questions (application_id, question_text, category, priority, reasoning)
VALUES 
  ('a3333333-3333-4333-a333-333333333333', 'What was your most challenging bootcamp project and what did you learn?', 'Learning Experience', 1, 'Assesses problem-solving ability'),
  ('a3333333-3333-4333-a333-333333333333', 'How do you approach learning a new technology or framework?', 'Growth Mindset', 1, 'Tests self-learning capabilities'),
  ('a3333333-3333-4333-a333-333333333333', 'Describe how you handle situations where you are stuck on a problem.', 'Problem Solving', 2, 'Evaluates resilience');

-- Recruiter Notes
INSERT INTO public.recruiter_notes (application_id, recruiter_id, note_text)
SELECT 'a1111111-1111-4111-a111-111111111111', id, 'Strong senior candidate. Consider for tech lead role.' FROM auth.users LIMIT 1;

INSERT INTO public.recruiter_notes (application_id, recruiter_id, note_text)
SELECT 'a2222222-2222-4222-a222-222222222222', id, 'Good cultural fit. Schedule technical assessment for React skills.' FROM auth.users LIMIT 1;

INSERT INTO public.recruiter_notes (application_id, recruiter_id, note_text)
SELECT 'a3333333-3333-4333-a333-333333333333', id, 'Junior but eager. Consider for trainee program if budget allows.' FROM auth.users LIMIT 1;
