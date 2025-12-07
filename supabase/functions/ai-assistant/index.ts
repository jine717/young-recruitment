import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Intent categories for smart data fetching
type Intent = 
  | 'candidate_search'
  | 'candidate_comparison'
  | 'analytics'
  | 'pipeline_status'
  | 'job_insights'
  | 'interview_management'
  | 'recommendations'
  | 'general';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Comprehensive CandidateContext matching frontend interface
interface CandidateContext {
  // Basic info
  id: string;
  name: string;
  email?: string;
  jobTitle: string;
  jobId: string;
  status: string;
  appliedAt?: string;
  
  // AI Evaluation
  aiScore?: number | null;
  recommendation?: string | null;
  strengths?: string[];
  concerns?: string[];
  evaluationSummary?: string;
  skillsMatchScore?: number | null;
  communicationScore?: number | null;
  culturalFitScore?: number | null;
  evaluationStage?: string;
  initialScore?: number | null;
  
  // Full CV Analysis
  cvAnalysis?: {
    summary?: string;
    experienceYears?: number;
    keySkills?: string[];
    education?: { degree: string; institution: string; year?: string }[];
    workHistory?: { company: string; role: string; duration?: string }[];
    strengths?: string[];
    redFlags?: string[];
    overallImpression?: string;
  };
  
  // Full DISC Analysis
  discAnalysis?: {
    profileType?: string;
    profileDescription?: string;
    dominantTraits?: string[];
    communicationStyle?: string;
    workStyle?: string;
    managementTips?: string;
    potentialChallenges?: string[];
    teamFitConsiderations?: string;
  };
  
  // Business Case Responses
  businessCaseResponses?: {
    questionTitle: string;
    questionDescription: string;
    response: string;
  }[];
  
  // Interview Questions (AI-generated)
  interviewQuestions?: {
    question: string;
    category: string;
    reasoning?: string;
    recruiterNote?: string;
  }[];
  
  // Fixed Interview Questions with Notes
  fixedQuestionNotes?: {
    question: string;
    category: string;
    note?: string;
  }[];
  
  // Interview Evaluation
  interviewEvaluation?: {
    overallImpression?: string;
    strengths?: string[];
    areasForImprovement?: string[];
    technicalScore?: number;
    communicationScore?: number;
    culturalFitScore?: number;
    problemSolvingScore?: number;
    recommendation?: string;
  };
  
  // Interview Analysis
  interviewAnalysis?: {
    summary?: string;
    performanceAssessment?: string;
    strengthsIdentified?: string[];
    concernsIdentified?: string[];
    scoreChangeExplanation?: string;
  };
  
  // Recruiter Notes
  recruiterNotes?: {
    note: string;
    createdAt: string;
  }[];
  
  // Scheduled Interviews
  scheduledInterviews?: {
    date: string;
    type: string;
    status: string;
  }[];
  
  // Hiring Decisions
  hiringDecisions?: {
    decision: string;
    reasoning: string;
    createdAt: string;
  }[];
}

interface AIAssistantRequest {
  question: string;
  conversationHistory?: Message[];
  candidateContext?: CandidateContext;
}

// Detect intent from user question
function detectIntent(question: string): Intent[] {
  const q = question.toLowerCase();
  const intents: Intent[] = [];

  // Candidate search patterns
  if (q.includes('who') || q.includes('candidate') || q.includes('applicant') || 
      q.includes('best') || q.includes('top') || q.includes('find') ||
      q.includes('skill') || q.includes('experience') || q.includes('knowledge')) {
    intents.push('candidate_search');
  }

  // Comparison patterns
  if (q.includes('compare') || q.includes('versus') || q.includes('vs') || 
      q.includes('difference') || q.includes('between')) {
    intents.push('candidate_comparison');
  }

  // Analytics patterns
  if (q.includes('analytics') || q.includes('statistics') || q.includes('metrics') ||
      q.includes('average') || q.includes('total') || q.includes('how many') ||
      q.includes('percentage') || q.includes('rate') || q.includes('trend')) {
    intents.push('analytics');
  }

  // Pipeline patterns
  if (q.includes('pipeline') || q.includes('status') || q.includes('stage') ||
      q.includes('pending') || q.includes('review') || q.includes('interview') ||
      q.includes('hired') || q.includes('rejected')) {
    intents.push('pipeline_status');
  }

  // Job insights patterns
  if (q.includes('job') || q.includes('position') || q.includes('vacancy') ||
      q.includes('opening') || q.includes('role') || q.includes('department')) {
    intents.push('job_insights');
  }

  // Interview management patterns
  if (q.includes('interview') || q.includes('schedule') || q.includes('meeting') ||
      q.includes('evaluation') || q.includes('feedback')) {
    intents.push('interview_management');
  }

  // Recommendation patterns
  if (q.includes('recommend') || q.includes('suggest') || q.includes('should') ||
      q.includes('next') || q.includes('priority') || q.includes('action')) {
    intents.push('recommendations');
  }

  // Default to general if no specific intent detected
  if (intents.length === 0) {
    intents.push('general');
  }

  return intents;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, conversationHistory = [], candidateContext } = await req.json() as AIAssistantRequest;

    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Assistant] Processing question:', question);
    console.log('[AI Assistant] Conversation history length:', conversationHistory.length);
    console.log('[AI Assistant] Candidate context:', candidateContext?.name || 'None');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect intents for smart data fetching
    const intents = detectIntent(question);
    console.log('[AI Assistant] Detected intents:', intents);

    // Fetch data based on detected intents
    const context = await fetchContextData(supabase, intents);
    console.log('[AI Assistant] Context fetched successfully');

    // Build system prompt with context (and candidate context if provided)
    const systemPrompt = buildSystemPrompt(context, candidateContext);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: question }
    ];

    // Call Lovable AI Gateway with streaming
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
      }),
    });

    // Handle rate limits and errors
    if (!response.ok) {
      if (response.status === 429) {
        console.error('[AI Assistant] Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few moments.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('[AI Assistant] Payment required - no AI credits');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue using the AI Assistant.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[AI Assistant] AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Assistant] Streaming response started');

    // Return the streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AI Assistant] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fetch context data based on detected intents
async function fetchContextData(supabase: any, intents: Intent[]) {
  const context: any = {
    overview: null,
    candidates: [],
    jobs: [],
    interviews: [],
    analytics: null,
    recentActivity: [],
  };

  // Always fetch overview stats for context
  const overviewPromise = fetchOverviewStats(supabase);

  // Fetch additional data based on intents
  const promises: Promise<any>[] = [overviewPromise];

  if (intents.includes('candidate_search') || intents.includes('candidate_comparison') || 
      intents.includes('recommendations') || intents.includes('general')) {
    promises.push(fetchCandidatesData(supabase));
  }

  if (intents.includes('job_insights') || intents.includes('general')) {
    promises.push(fetchJobsData(supabase));
  }

  if (intents.includes('interview_management') || intents.includes('pipeline_status')) {
    promises.push(fetchInterviewsData(supabase));
  }

  if (intents.includes('analytics') || intents.includes('pipeline_status')) {
    promises.push(fetchAnalyticsData(supabase));
  }

  if (intents.includes('recommendations') || intents.includes('general')) {
    promises.push(fetchRecentActivity(supabase));
  }

  const results = await Promise.all(promises);
  
  context.overview = results[0];
  
  let idx = 1;
  if (intents.includes('candidate_search') || intents.includes('candidate_comparison') || 
      intents.includes('recommendations') || intents.includes('general')) {
    context.candidates = results[idx++] || [];
  }
  if (intents.includes('job_insights') || intents.includes('general')) {
    context.jobs = results[idx++] || [];
  }
  if (intents.includes('interview_management') || intents.includes('pipeline_status')) {
    context.interviews = results[idx++] || [];
  }
  if (intents.includes('analytics') || intents.includes('pipeline_status')) {
    context.analytics = results[idx++] || null;
  }
  if (intents.includes('recommendations') || intents.includes('general')) {
    context.recentActivity = results[idx++] || [];
  }

  return context;
}

// Fetch overview statistics
async function fetchOverviewStats(supabase: any) {
  const [
    { count: totalApplications },
    { count: totalJobs },
    { data: statusCounts },
  ] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('applications').select('status'),
  ]);

  const statusBreakdown = (statusCounts || []).reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalApplications: totalApplications || 0,
    totalActiveJobs: totalJobs || 0,
    statusBreakdown,
  };
}

// Fetch candidates with their evaluations and analyses
async function fetchCandidatesData(supabase: any) {
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      candidate_name,
      candidate_email,
      status,
      ai_score,
      ai_evaluation_status,
      created_at,
      job_id,
      jobs (
        title,
        departments (name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!applications || applications.length === 0) return [];

  // Fetch AI evaluations for these applications
  const applicationIds = applications.map((a: any) => a.id);
  
  const { data: evaluations } = await supabase
    .from('ai_evaluations')
    .select('*')
    .in('application_id', applicationIds);

  const { data: documentAnalyses } = await supabase
    .from('document_analyses')
    .select('application_id, document_type, summary, analysis')
    .in('application_id', applicationIds)
    .eq('status', 'completed');

  // Merge data
  return applications.map((app: any) => {
    const evaluation = evaluations?.find((e: any) => e.application_id === app.id);
    const cvAnalysis = documentAnalyses?.find((d: any) => d.application_id === app.id && d.document_type === 'cv');
    const discAnalysis = documentAnalyses?.find((d: any) => d.application_id === app.id && d.document_type === 'disc');

    return {
      id: app.id,
      name: app.candidate_name,
      email: app.candidate_email,
      status: app.status,
      aiScore: app.ai_score,
      jobTitle: app.jobs?.title,
      department: app.jobs?.departments?.name,
      appliedAt: app.created_at,
      evaluation: evaluation ? {
        overallScore: evaluation.overall_score,
        skillsScore: evaluation.skills_match_score,
        communicationScore: evaluation.communication_score,
        culturalFitScore: evaluation.cultural_fit_score,
        recommendation: evaluation.recommendation,
        strengths: evaluation.strengths,
        concerns: evaluation.concerns,
        summary: evaluation.summary,
      } : null,
      cvSummary: cvAnalysis?.summary,
      cvSkills: cvAnalysis?.analysis?.skills,
      discProfile: discAnalysis?.analysis?.profile_type,
      discTraits: discAnalysis?.analysis?.dominant_traits,
    };
  });
}

// Fetch jobs data with application counts
async function fetchJobsData(supabase: any) {
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      status,
      location,
      type,
      created_at,
      departments (name)
    `)
    .order('created_at', { ascending: false });

  if (!jobs) return [];

  // Get application counts per job
  const { data: applications } = await supabase
    .from('applications')
    .select('job_id, status, ai_score');

  return jobs.map((job: any) => {
    const jobApps = applications?.filter((a: any) => a.job_id === job.id) || [];
    const statusCounts = jobApps.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    const avgScore = jobApps.length > 0 
      ? Math.round(jobApps.reduce((sum: number, a: any) => sum + (a.ai_score || 0), 0) / jobApps.length)
      : null;

    return {
      id: job.id,
      title: job.title,
      status: job.status,
      location: job.location,
      type: job.type,
      department: job.departments?.name,
      createdAt: job.created_at,
      totalApplications: jobApps.length,
      statusBreakdown: statusCounts,
      averageAIScore: avgScore,
    };
  });
}

// Fetch interviews data
async function fetchInterviewsData(supabase: any) {
  const { data: interviews } = await supabase
    .from('interviews')
    .select(`
      id,
      interview_date,
      interview_type,
      status,
      duration_minutes,
      application_id,
      applications (
        candidate_name,
        jobs (title)
      )
    `)
    .order('interview_date', { ascending: true })
    .limit(20);

  return (interviews || []).map((interview: any) => ({
    id: interview.id,
    date: interview.interview_date,
    type: interview.interview_type,
    status: interview.status,
    duration: interview.duration_minutes,
    candidateName: interview.applications?.candidate_name,
    jobTitle: interview.applications?.jobs?.title,
  }));
}

// Fetch analytics data
async function fetchAnalyticsData(supabase: any) {
  const { data: applications } = await supabase
    .from('applications')
    .select('status, ai_score, created_at');

  const { data: hiringDecisions } = await supabase
    .from('hiring_decisions')
    .select('decision, created_at');

  if (!applications) return null;

  const totalApps = applications.length;
  const statusCounts = applications.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const avgAIScore = applications.filter((a: any) => a.ai_score).length > 0
    ? Math.round(applications.filter((a: any) => a.ai_score).reduce((sum: number, a: any) => sum + a.ai_score, 0) / applications.filter((a: any) => a.ai_score).length)
    : null;

  const hiredCount = hiringDecisions?.filter((d: any) => d.decision === 'hired').length || 0;
  const rejectedCount = hiringDecisions?.filter((d: any) => d.decision === 'rejected').length || 0;

  // Calculate conversion rates
  const interviewRate = totalApps > 0 ? ((statusCounts.interview || 0) / totalApps * 100).toFixed(1) : '0';
  const hireRate = totalApps > 0 ? (hiredCount / totalApps * 100).toFixed(1) : '0';

  return {
    totalApplications: totalApps,
    statusBreakdown: statusCounts,
    averageAIScore: avgAIScore,
    hiredCount,
    rejectedCount,
    interviewConversionRate: `${interviewRate}%`,
    hireConversionRate: `${hireRate}%`,
  };
}

// Fetch recent activity
async function fetchRecentActivity(supabase: any) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentApps },
    { data: recentDecisions },
    { data: recentInterviews },
  ] = await Promise.all([
    supabase
      .from('applications')
      .select('candidate_name, status, created_at, jobs(title)')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('hiring_decisions')
      .select('decision, created_at, applications(candidate_name, jobs(title))')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('interviews')
      .select('interview_date, status, applications(candidate_name, jobs(title))')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    recentApplications: recentApps || [],
    recentDecisions: recentDecisions || [],
    recentInterviews: recentInterviews || [],
  };
}

// Build system prompt with comprehensive candidate context
function buildSystemPrompt(context: any, candidateContext?: CandidateContext) {
  const { overview, candidates, jobs, interviews, analytics, recentActivity } = context;

  let prompt = `You are an AI assistant for the Young recruitment platform. You help recruiters make data-driven decisions by answering questions about candidates, job openings, and recruitment analytics.

## Your Capabilities
- Search and analyze candidate profiles, skills, and qualifications
- Compare candidates for specific positions
- Provide recruitment analytics and insights
- Track pipeline status and interview schedules
- Make recommendations based on data

## Guidelines
- Be concise and actionable in your responses
- When discussing candidates, include relevant scores and key qualifications
- Always cite specific data points when making recommendations
- If you don't have enough information, say so clearly
- Format responses with clear sections when presenting multiple items
`;

  // Add comprehensive candidate-specific context if provided
  if (candidateContext) {
    prompt += `
## CURRENT CANDIDATE FOCUS: ${candidateContext.name}
You are helping the recruiter evaluate this specific candidate. Focus your answers on this candidate unless asked about others.

### Basic Information
- **Name:** ${candidateContext.name}
- **Email:** ${candidateContext.email || 'Not provided'}
- **Applied For:** ${candidateContext.jobTitle}
- **Current Status:** ${candidateContext.status}
- **Applied On:** ${candidateContext.appliedAt ? new Date(candidateContext.appliedAt).toLocaleDateString() : 'Unknown'}
`;

    // AI Evaluation section
    prompt += `
### AI Evaluation
- **Overall AI Score:** ${candidateContext.aiScore ?? 'Not evaluated yet'}
- **Recommendation:** ${candidateContext.recommendation || 'Pending'}
- **Evaluation Stage:** ${candidateContext.evaluationStage || 'Initial'}
`;

    if (candidateContext.initialScore && candidateContext.evaluationStage === 'post_interview') {
      prompt += `- **Initial Score (Pre-Interview):** ${candidateContext.initialScore}
- **Score Change:** ${(candidateContext.aiScore || 0) - candidateContext.initialScore} points
`;
    }

    if (candidateContext.skillsMatchScore || candidateContext.communicationScore || candidateContext.culturalFitScore) {
      prompt += `- **Skills Match Score:** ${candidateContext.skillsMatchScore ?? 'N/A'}/100
- **Communication Score:** ${candidateContext.communicationScore ?? 'N/A'}/100
- **Cultural Fit Score:** ${candidateContext.culturalFitScore ?? 'N/A'}/100
`;
    }

    if (candidateContext.strengths?.length) {
      prompt += `- **Key Strengths:** ${candidateContext.strengths.join(', ')}
`;
    }

    if (candidateContext.concerns?.length) {
      prompt += `- **Areas of Concern:** ${candidateContext.concerns.join(', ')}
`;
    }

    if (candidateContext.evaluationSummary) {
      prompt += `- **Evaluation Summary:** ${candidateContext.evaluationSummary}
`;
    }

    // CV Analysis section
    if (candidateContext.cvAnalysis) {
      const cv = candidateContext.cvAnalysis;
      prompt += `
### CV/Resume Analysis
`;
      if (cv.summary) prompt += `- **Summary:** ${cv.summary}\n`;
      if (cv.experienceYears) prompt += `- **Years of Experience:** ${cv.experienceYears}\n`;
      if (cv.keySkills?.length) prompt += `- **Key Skills:** ${cv.keySkills.join(', ')}\n`;
      
      // Handle education - could be string or array
      if (cv.education) {
        prompt += `- **Education:**\n`;
        if (Array.isArray(cv.education)) {
          cv.education.forEach(edu => {
            if (typeof edu === 'string') {
              prompt += `  - ${edu}\n`;
            } else {
              prompt += `  - ${edu.degree} from ${edu.institution}${edu.year ? ` (${edu.year})` : ''}\n`;
            }
          });
        } else if (typeof cv.education === 'string') {
          prompt += `  - ${cv.education}\n`;
        }
      }
      
      // Handle work history - could be string or array
      if (cv.workHistory) {
        prompt += `- **Work History:**\n`;
        if (Array.isArray(cv.workHistory)) {
          cv.workHistory.forEach(work => {
            if (typeof work === 'string') {
              prompt += `  - ${work}\n`;
            } else {
              prompt += `  - ${work.role} at ${work.company}${work.duration ? ` (${work.duration})` : ''}\n`;
            }
          });
        } else if (typeof cv.workHistory === 'string') {
          prompt += `  - ${cv.workHistory}\n`;
        }
      }
      
      if (cv.strengths?.length) prompt += `- **CV Strengths:** ${cv.strengths.join(', ')}\n`;
      if (cv.redFlags?.length) prompt += `- **Red Flags/Concerns:** ${cv.redFlags.join(', ')}\n`;
      if (cv.overallImpression) prompt += `- **Overall Impression:** ${cv.overallImpression}\n`;
    }

    // DISC Analysis section
    if (candidateContext.discAnalysis) {
      const disc = candidateContext.discAnalysis;
      prompt += `
### DISC Personality Profile
`;
      if (disc.profileType) prompt += `- **Profile Type:** ${disc.profileType}\n`;
      if (disc.profileDescription) prompt += `- **Description:** ${disc.profileDescription}\n`;
      if (disc.dominantTraits?.length) prompt += `- **Dominant Traits:** ${disc.dominantTraits.join(', ')}\n`;
      if (disc.communicationStyle) prompt += `- **Communication Style:** ${disc.communicationStyle}\n`;
      if (disc.workStyle) prompt += `- **Work Style:** ${disc.workStyle}\n`;
      if (disc.managementTips) prompt += `- **Management Tips:** ${disc.managementTips}\n`;
      if (disc.potentialChallenges?.length) prompt += `- **Potential Challenges:** ${disc.potentialChallenges.join(', ')}\n`;
      if (disc.teamFitConsiderations) prompt += `- **Team Fit Considerations:** ${disc.teamFitConsiderations}\n`;
    }

    // Business Case Responses section
    if (candidateContext.businessCaseResponses?.length) {
      prompt += `
### Business Case Responses
`;
      candidateContext.businessCaseResponses.forEach((bc, idx) => {
        prompt += `
**Question ${idx + 1}: ${bc.questionTitle}**
${bc.questionDescription}

**Candidate's Response:**
${bc.response}
`;
      });
    }

    // Interview Questions section
    if (candidateContext.interviewQuestions?.length) {
      prompt += `
### AI-Generated Interview Questions
`;
      candidateContext.interviewQuestions.forEach((q, idx) => {
        prompt += `${idx + 1}. **${q.question}** (${q.category})`;
        if (q.reasoning) prompt += `\n   - Reasoning: ${q.reasoning}`;
        if (q.recruiterNote) prompt += `\n   - Recruiter Note: ${q.recruiterNote}`;
        prompt += '\n';
      });
    }

    // Fixed Interview Questions with Notes
    if (candidateContext.fixedQuestionNotes?.length) {
      prompt += `
### Fixed Interview Questions & Notes
`;
      candidateContext.fixedQuestionNotes.forEach((q, idx) => {
        prompt += `${idx + 1}. **${q.question}** (${q.category})`;
        if (q.note) prompt += `\n   - Recruiter Note: ${q.note}`;
        prompt += '\n';
      });
    }

    // Interview Evaluation section
    if (candidateContext.interviewEvaluation) {
      const eval_ = candidateContext.interviewEvaluation;
      prompt += `
### Interview Evaluation (Recruiter Assessment)
`;
      if (eval_.technicalScore) prompt += `- **Technical Score:** ${eval_.technicalScore}/10\n`;
      if (eval_.communicationScore) prompt += `- **Communication Score:** ${eval_.communicationScore}/10\n`;
      if (eval_.culturalFitScore) prompt += `- **Cultural Fit Score:** ${eval_.culturalFitScore}/10\n`;
      if (eval_.problemSolvingScore) prompt += `- **Problem Solving Score:** ${eval_.problemSolvingScore}/10\n`;
      if (eval_.recommendation) prompt += `- **Recruiter Recommendation:** ${eval_.recommendation}\n`;
      if (eval_.overallImpression) prompt += `- **Overall Impression:** ${eval_.overallImpression}\n`;
      if (eval_.strengths?.length) prompt += `- **Strengths Observed:** ${eval_.strengths.join(', ')}\n`;
      if (eval_.areasForImprovement?.length) prompt += `- **Areas for Improvement:** ${eval_.areasForImprovement.join(', ')}\n`;
    }

    // Interview Analysis section
    if (candidateContext.interviewAnalysis) {
      const analysis = candidateContext.interviewAnalysis;
      prompt += `
### Post-Interview AI Analysis
`;
      if (analysis.summary) prompt += `- **Summary:** ${analysis.summary}\n`;
      if (analysis.performanceAssessment) prompt += `- **Performance Assessment:** ${analysis.performanceAssessment}\n`;
      if (analysis.strengthsIdentified?.length) prompt += `- **Strengths Identified:** ${analysis.strengthsIdentified.join(', ')}\n`;
      if (analysis.concernsIdentified?.length) prompt += `- **Concerns Identified:** ${analysis.concernsIdentified.join(', ')}\n`;
      if (analysis.scoreChangeExplanation) prompt += `- **Score Change Explanation:** ${analysis.scoreChangeExplanation}\n`;
    }

    // Recruiter Notes section
    if (candidateContext.recruiterNotes?.length) {
      prompt += `
### Recruiter Notes (Chronological)
`;
      candidateContext.recruiterNotes.forEach(note => {
        const date = new Date(note.createdAt).toLocaleDateString();
        prompt += `- [${date}] ${note.note}\n`;
      });
    }

    // Scheduled Interviews section
    if (candidateContext.scheduledInterviews?.length) {
      prompt += `
### Scheduled Interviews
`;
      candidateContext.scheduledInterviews.forEach(interview => {
        const date = new Date(interview.date).toLocaleString();
        prompt += `- ${date} | ${interview.type} | Status: ${interview.status}\n`;
      });
    }

    // Hiring Decisions section
    if (candidateContext.hiringDecisions?.length) {
      prompt += `
### Hiring Decision History
`;
      candidateContext.hiringDecisions.forEach(decision => {
        const date = new Date(decision.createdAt).toLocaleDateString();
        prompt += `- [${date}] **${decision.decision}**: ${decision.reasoning}\n`;
      });
    }

    prompt += `
### Instructions for Answering
1. Prioritize information about ${candidateContext.name} when answering
2. Reference their specific scores, experience, skills, and personality traits
3. Use data from CV analysis, DISC profile, and business case responses when relevant
4. Provide actionable recommendations for interviewing or decision-making
5. Compare to other candidates only when explicitly asked
`;
  }

  prompt += `
## Current Recruitment Overview
`;

  if (overview) {
    prompt += `
- Total Applications: ${overview.totalApplications}
- Active Job Openings: ${overview.totalActiveJobs}
- Pipeline Status: ${JSON.stringify(overview.statusBreakdown)}
`;
  }

  if (analytics) {
    prompt += `
## Analytics Summary
- Average AI Score: ${analytics.averageAIScore || 'N/A'}
- Interview Conversion Rate: ${analytics.interviewConversionRate}
- Hire Conversion Rate: ${analytics.hireConversionRate}
- Total Hired: ${analytics.hiredCount}
- Total Rejected: ${analytics.rejectedCount}
`;
  }

  if (jobs && jobs.length > 0) {
    prompt += `
## Active Job Positions (${jobs.length} total)
${jobs.slice(0, 10).map((j: any) => `- ${j.title} (${j.department || 'No dept'}): ${j.totalApplications} applications, Avg Score: ${j.averageAIScore || 'N/A'}`).join('\n')}
`;
  }

  if (candidates && candidates.length > 0) {
    prompt += `
## Candidate Database (${candidates.length} recent candidates)
${candidates.slice(0, 20).map((c: any) => {
  const skills = c.cvSkills?.slice(0, 5).join(', ') || 'Not analyzed';
  return `- ${c.name} | ${c.jobTitle || 'Unknown position'} | Score: ${c.aiScore || 'N/A'} | Status: ${c.status} | Skills: ${skills} | DISC: ${c.discProfile || 'N/A'}`;
}).join('\n')}
`;
  }

  if (interviews && interviews.length > 0) {
    prompt += `
## Scheduled Interviews
${interviews.map((i: any) => `- ${i.candidateName} for ${i.jobTitle} | ${new Date(i.date).toLocaleDateString()} | ${i.type} | Status: ${i.status}`).join('\n')}
`;
  }

  if (recentActivity && (recentActivity.recentApplications?.length > 0 || recentActivity.recentDecisions?.length > 0)) {
    prompt += `
## Recent Activity (Last 7 Days)
`;
    if (recentActivity.recentApplications?.length > 0) {
      prompt += `New Applications: ${recentActivity.recentApplications.length}\n`;
    }
    if (recentActivity.recentDecisions?.length > 0) {
      prompt += `Hiring Decisions Made: ${recentActivity.recentDecisions.length}\n`;
    }
  }

  prompt += `
## Response Format
When listing candidates or making comparisons, use clear formatting:
- Use bullet points for lists
- Include relevant scores and metrics
- Highlight key differentiators
- Provide actionable next steps when appropriate

Now answer the recruiter's question based on the data above.`;

  return prompt;
}