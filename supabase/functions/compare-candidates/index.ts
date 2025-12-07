import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterviewEvaluation {
  technical_score: number | null;
  communication_score: number | null;
  cultural_fit_score: number | null;
  problem_solving_score: number | null;
  overall_impression: string | null;
  strengths: string[];
  areas_for_improvement: string[];
  recommendation: string | null;
  interview_date: string | null;
}

interface InterviewAnalysis {
  interview_summary: string | null;
  performance_assessment: string | null;
  strengths_demonstrated: string[];
  concerns_identified: string[];
  score_change_explanation: string | null;
}

interface RecruiterNote {
  note_text: string;
  created_at: string;
}

interface CVAnalysis {
  experience_years: number | null;
  key_skills: string[];
  education: string | null;
  strengths: string[];
  red_flags: string[];
}

interface DISCAnalysis {
  profile_type: string | null;
  traits: string[];
  communication_style: string | null;
  work_style: string | null;
}

interface CandidateData {
  application_id: string;
  candidate_name: string;
  candidate_email: string;
  ai_score: number | null;
  initial_ai_score: number | null;
  evaluation_stage: string | null;
  ai_evaluation: {
    overall_score: number | null;
    skills_match_score: number | null;
    communication_score: number | null;
    cultural_fit_score: number | null;
    summary: string | null;
    strengths: string[] | null;
    concerns: string[] | null;
    recommendation: string | null;
    initial_overall_score: number | null;
  } | null;
  business_case_responses: {
    question_id: string;
    question_title: string;
    question_description: string;
    text_response: string | null;
  }[];
  // NEW: Interview data
  interview_evaluation: InterviewEvaluation | null;
  interview_analysis: InterviewAnalysis | null;
  recruiter_notes: RecruiterNote[];
  cv_analysis: CVAnalysis | null;
  disc_analysis: DISCAnalysis | null;
}

interface BusinessCaseQuestion {
  id: string;
  question_title: string;
  question_description: string;
  question_number: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationIds, customPrompt, jobId, createdBy } = await req.json();

    if (!applicationIds || applicationIds.length < 2) {
      throw new Error('At least 2 candidates are required for comparison');
    }

    if (applicationIds.length > 3) {
      throw new Error('Maximum 3 candidates can be compared at once');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, description, requirements, responsibilities')
      .eq('id', jobId)
      .single();

    if (jobError) throw new Error('Failed to fetch job details');

    // Fetch business case questions for this job
    const { data: businessCases, error: bcError } = await supabase
      .from('business_cases')
      .select('id, question_title, question_description, question_number')
      .eq('job_id', jobId)
      .order('question_number', { ascending: true });

    if (bcError) {
      console.error('Error fetching business cases:', bcError);
    }

    const businessCaseQuestions: BusinessCaseQuestion[] = businessCases || [];

    // Fetch candidates data with all enriched information
    const candidatesData: CandidateData[] = [];

    for (const appId of applicationIds) {
      // Get application
      const { data: app, error: appError } = await supabase
        .from('applications')
        .select('id, candidate_name, candidate_email, ai_score')
        .eq('id', appId)
        .single();

      if (appError) continue;

      // Get AI evaluation with initial scores
      const { data: aiEval } = await supabase
        .from('ai_evaluations')
        .select('*')
        .eq('application_id', appId)
        .maybeSingle();

      // Get business case responses with question details
      const { data: responses } = await supabase
        .from('business_case_responses')
        .select(`
          text_response,
          business_case_id,
          business_cases!inner(id, question_title, question_description, question_number)
        `)
        .eq('application_id', appId)
        .order('business_cases(question_number)', { ascending: true });

      // NEW: Get interview evaluation (recruiter's manual evaluation)
      const { data: interviewEval } = await supabase
        .from('interview_evaluations')
        .select('*')
        .eq('application_id', appId)
        .order('interview_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // NEW: Get interview analysis (AI analysis from analyze-interview function)
      const { data: interviewAnalysisDoc } = await supabase
        .from('document_analyses')
        .select('analysis')
        .eq('application_id', appId)
        .eq('document_type', 'interview')
        .eq('status', 'completed')
        .maybeSingle();

      // NEW: Get CV analysis
      const { data: cvAnalysisDoc } = await supabase
        .from('document_analyses')
        .select('analysis')
        .eq('application_id', appId)
        .eq('document_type', 'cv')
        .eq('status', 'completed')
        .maybeSingle();

      // NEW: Get DISC analysis
      const { data: discAnalysisDoc } = await supabase
        .from('document_analyses')
        .select('analysis')
        .eq('application_id', appId)
        .eq('document_type', 'disc')
        .eq('status', 'completed')
        .maybeSingle();

      // NEW: Get recruiter notes
      const { data: notes } = await supabase
        .from('recruiter_notes')
        .select('note_text, created_at')
        .eq('application_id', appId)
        .order('created_at', { ascending: false });

      // Parse interview analysis from document
      let interviewAnalysis: InterviewAnalysis | null = null;
      if (interviewAnalysisDoc?.analysis) {
        const analysis = interviewAnalysisDoc.analysis as any;
        interviewAnalysis = {
          interview_summary: analysis.interview_summary || null,
          performance_assessment: analysis.performance_assessment || null,
          strengths_demonstrated: analysis.strengths_demonstrated || [],
          concerns_identified: analysis.concerns_identified || [],
          score_change_explanation: analysis.score_change_explanation || null,
        };
      }

      // Parse CV analysis
      let cvAnalysis: CVAnalysis | null = null;
      if (cvAnalysisDoc?.analysis) {
        const analysis = cvAnalysisDoc.analysis as any;
        cvAnalysis = {
          experience_years: analysis.experience_years || null,
          key_skills: analysis.key_skills || [],
          education: analysis.education || null,
          strengths: analysis.strengths || [],
          red_flags: analysis.red_flags || [],
        };
      }

      // Parse DISC analysis
      let discAnalysis: DISCAnalysis | null = null;
      if (discAnalysisDoc?.analysis) {
        const analysis = discAnalysisDoc.analysis as any;
        discAnalysis = {
          profile_type: analysis.profile_type || null,
          traits: analysis.traits || [],
          communication_style: analysis.communication_style || null,
          work_style: analysis.work_style || null,
        };
      }

      candidatesData.push({
        application_id: app.id,
        candidate_name: app.candidate_name,
        candidate_email: app.candidate_email,
        ai_score: app.ai_score,
        initial_ai_score: aiEval?.initial_overall_score || null,
        evaluation_stage: aiEval?.evaluation_stage || 'initial',
        ai_evaluation: aiEval ? {
          overall_score: aiEval.overall_score,
          skills_match_score: aiEval.skills_match_score,
          communication_score: aiEval.communication_score,
          cultural_fit_score: aiEval.cultural_fit_score,
          summary: aiEval.summary,
          strengths: aiEval.strengths,
          concerns: aiEval.concerns,
          recommendation: aiEval.recommendation,
          initial_overall_score: aiEval.initial_overall_score,
        } : null,
        business_case_responses: responses?.map(r => ({
          question_id: (r.business_cases as any).id,
          question_title: (r.business_cases as any).question_title,
          question_description: (r.business_cases as any).question_description || '',
          text_response: r.text_response,
        })) || [],
        // NEW: Interview and document data
        interview_evaluation: interviewEval ? {
          technical_score: interviewEval.technical_score,
          communication_score: interviewEval.communication_score,
          cultural_fit_score: interviewEval.cultural_fit_score,
          problem_solving_score: interviewEval.problem_solving_score,
          overall_impression: interviewEval.overall_impression,
          strengths: interviewEval.strengths || [],
          areas_for_improvement: interviewEval.areas_for_improvement || [],
          recommendation: interviewEval.recommendation,
          interview_date: interviewEval.interview_date,
        } : null,
        interview_analysis: interviewAnalysis,
        recruiter_notes: notes?.map(n => ({
          note_text: n.note_text,
          created_at: n.created_at,
        })) || [],
        cv_analysis: cvAnalysis,
        disc_analysis: discAnalysis,
      });
    }

    if (candidatesData.length < 2) {
      throw new Error('Could not fetch enough candidate data for comparison');
    }

    // Build comprehensive comparison prompt with all candidate data
    const candidatesInfo = candidatesData.map((c, i) => {
      // Calculate score trajectory if post-interview
      const scoreChange = c.initial_ai_score && c.ai_score 
        ? c.ai_score - c.initial_ai_score 
        : null;
      const scoreTrajectory = scoreChange !== null 
        ? `${c.initial_ai_score} → ${c.ai_score} (${scoreChange > 0 ? '+' : ''}${scoreChange})` 
        : 'N/A';

      return `
### Candidate ${i + 1}: ${c.candidate_name}
**Evaluation Stage:** ${c.evaluation_stage === 'post_interview' ? 'POST-INTERVIEW (has been interviewed)' : 'INITIAL (application stage only)'}

## AI Evaluation Scores
- Current AI Score: ${c.ai_evaluation?.overall_score ?? 'N/A'}/100
- Skills Match: ${c.ai_evaluation?.skills_match_score ?? 'N/A'}/100
- Communication: ${c.ai_evaluation?.communication_score ?? 'N/A'}/100
- Cultural Fit: ${c.ai_evaluation?.cultural_fit_score ?? 'N/A'}/100
- AI Recommendation: ${c.ai_evaluation?.recommendation ?? 'N/A'}
- Summary: ${c.ai_evaluation?.summary ?? 'No summary available'}
- Strengths: ${c.ai_evaluation?.strengths?.join(', ') ?? 'None identified'}
- Concerns: ${c.ai_evaluation?.concerns?.join(', ') ?? 'None identified'}
${c.evaluation_stage === 'post_interview' ? `- Score Trajectory: ${scoreTrajectory}` : ''}

## CV Analysis
${c.cv_analysis ? `
- Experience: ${c.cv_analysis.experience_years ? `${c.cv_analysis.experience_years} years` : 'Unknown'}
- Key Skills: ${c.cv_analysis.key_skills?.join(', ') || 'Not analyzed'}
- Education: ${c.cv_analysis.education || 'Not specified'}
- CV Strengths: ${c.cv_analysis.strengths?.join(', ') || 'None identified'}
- CV Red Flags: ${c.cv_analysis.red_flags?.join(', ') || 'None identified'}
` : 'No CV analysis available'}

## DISC Personality Profile
${c.disc_analysis ? `
- Profile Type: ${c.disc_analysis.profile_type || 'Unknown'}
- Key Traits: ${c.disc_analysis.traits?.join(', ') || 'Not analyzed'}
- Communication Style: ${c.disc_analysis.communication_style || 'Not specified'}
- Work Style: ${c.disc_analysis.work_style || 'Not specified'}
` : 'No DISC analysis available'}

## Interview Performance
${c.interview_evaluation ? `
**Recruiter Evaluation:**
- Technical Score: ${c.interview_evaluation.technical_score ?? 'N/A'}/5
- Communication Score: ${c.interview_evaluation.communication_score ?? 'N/A'}/5
- Cultural Fit Score: ${c.interview_evaluation.cultural_fit_score ?? 'N/A'}/5
- Problem Solving Score: ${c.interview_evaluation.problem_solving_score ?? 'N/A'}/5
- Recruiter Recommendation: ${c.interview_evaluation.recommendation || 'N/A'}
- Overall Impression: ${c.interview_evaluation.overall_impression || 'Not provided'}
- Interview Strengths: ${c.interview_evaluation.strengths?.join(', ') || 'None noted'}
- Areas for Improvement: ${c.interview_evaluation.areas_for_improvement?.join(', ') || 'None noted'}
` : 'No interview evaluation available'}

${c.interview_analysis ? `
**AI Interview Analysis:**
- Interview Summary: ${c.interview_analysis.interview_summary || 'Not available'}
- Performance Assessment: ${c.interview_analysis.performance_assessment || 'Not available'}
- Demonstrated Strengths: ${c.interview_analysis.strengths_demonstrated?.join(', ') || 'None identified'}
- Identified Concerns: ${c.interview_analysis.concerns_identified?.join(', ') || 'None identified'}
${c.interview_analysis.score_change_explanation ? `- Score Change Explanation: ${c.interview_analysis.score_change_explanation}` : ''}
` : ''}

${c.recruiter_notes.length > 0 ? `
**Recruiter Notes from Interview:**
${c.recruiter_notes.map(n => `- ${n.note_text}`).join('\n')}
` : ''}

## Business Case Responses
${c.business_case_responses.map(r => `
**Question:** ${r.question_title}
**Description:** ${r.question_description}
**${c.candidate_name}'s Response:** ${r.text_response || 'No response provided'}
`).join('\n')}
`;
    }).join('\n---\n');

    // List of business case questions for the AI to analyze
    const businessCaseInfo = businessCaseQuestions.length > 0 
      ? `\n### Business Case Questions for Analysis:\n${businessCaseQuestions.map((q, i) => 
          `${i + 1}. "${q.question_title}" - ${q.question_description || 'No description'}`
        ).join('\n')}\n`
      : '';

    const systemPrompt = `You are an expert recruitment analyst for Young, a company that values: Fearless, Unusual, Down to earth, Agility, Determination, and Authenticity.

Your task is to compare final candidates for a position and provide a clear, actionable recommendation.

Job Position: ${job.title}
Job Description: ${job.description}
Requirements: ${job.requirements?.join(', ') || 'Not specified'}
${businessCaseInfo}
${customPrompt ? `\n### Custom Evaluation Instructions from Recruiter:\n${customPrompt}\n` : ''}

CRITICAL: Analyze candidates considering BOTH application AND interview performance:

## 1. Application Stage Assessment
- CV/Resume analysis (experience, skills, education, identified strengths and red flags)
- DISC personality profile (communication style, work style, team fit)
- Business Case responses (problem-solving approach, communication quality)

## 2. Interview Stage Assessment (if available)
- Recruiter's evaluation scores (technical, communication, cultural fit, problem-solving)
- Recruiter's observations, notes, and overall impression
- AI interview analysis results
- Demonstrated strengths vs. identified concerns during interview

## 3. Performance Trajectory Analysis
- Initial AI Score vs Post-Interview Score (improvement or decline)
- Gap between written responses (Business Case) and verbal performance (Interview)
- Consistency between CV claims and interview performance

IMPORTANT CONSIDERATIONS:
- A candidate may excel in Business Case but struggle in interview, or vice versa
- Weight both application AND interview performance equally when both are available
- Highlight any discrepancies between written and verbal performance
- Consider personality insights from DISC when evaluating cultural fit
- Use recruiter notes as valuable firsthand observations

Be direct and decisive in your recommendation. For candidates with interviews, the interview performance should significantly influence your assessment.`;

    const userPrompt = `Compare these ${candidatesData.length} candidates and provide your analysis:

${candidatesInfo}

Provide a comprehensive comparison with a clear winner recommendation. 

IMPORTANT: 
1. For the business_case_analysis section, analyze each business case question separately
2. For the interview_performance_analysis section, compare interview performance across all candidates who have been interviewed
3. Highlight any differences between application-stage performance and interview performance`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_comparison_result',
            description: 'Provide structured comparison of candidates including business case and interview analysis',
            parameters: {
              type: 'object',
              properties: {
                executive_summary: {
                  type: 'string',
                  description: 'Brief 2-3 sentence summary of the comparison outcome, highlighting if interview performance changed the assessment'
                },
                rankings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rank: { type: 'number' },
                      candidate_name: { type: 'string' },
                      application_id: { type: 'string' },
                      score: { type: 'number', description: 'Overall score 0-100' },
                      key_differentiator: { type: 'string', description: 'What sets this candidate apart' }
                    },
                    required: ['rank', 'candidate_name', 'application_id', 'score', 'key_differentiator']
                  }
                },
                comparison_matrix: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      criterion: { type: 'string' },
                      candidates: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            application_id: { type: 'string' },
                            score: { type: 'number' },
                            notes: { type: 'string' }
                          },
                          required: ['application_id', 'score', 'notes']
                        }
                      }
                    },
                    required: ['criterion', 'candidates']
                  }
                },
                recommendation: {
                  type: 'object',
                  properties: {
                    top_choice: { type: 'string', description: 'Name of recommended candidate' },
                    application_id: { type: 'string' },
                    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                    justification: { type: 'string', description: 'Detailed reason for recommendation, including interview performance if applicable' },
                    alternative: { type: 'string', description: 'Second choice candidate name or null' },
                    alternative_justification: { type: 'string', description: 'Why this is a good alternative' }
                  },
                  required: ['top_choice', 'application_id', 'confidence', 'justification']
                },
                risks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      candidate_name: { type: 'string' },
                      application_id: { type: 'string' },
                      risks: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['candidate_name', 'application_id', 'risks']
                  }
                },
                business_case_analysis: {
                  type: 'array',
                  description: 'Analysis of each business case question with all candidate responses compared',
                  items: {
                    type: 'object',
                    properties: {
                      question_title: { type: 'string', description: 'The business case question title' },
                      question_description: { type: 'string', description: 'The business case question description' },
                      candidate_responses: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            application_id: { type: 'string' },
                            candidate_name: { type: 'string' },
                            response_summary: { type: 'string', description: 'Brief summary of what the candidate said' },
                            score: { type: 'number', description: 'Score 0-100 for this response quality' },
                            assessment: { type: 'string', description: 'Brief assessment of response quality and depth' }
                          },
                          required: ['application_id', 'candidate_name', 'response_summary', 'score', 'assessment']
                        }
                      },
                      comparative_analysis: { type: 'string', description: 'AI analysis comparing all responses to this specific question' },
                      best_response: { type: 'string', description: 'Name of candidate with the best response' }
                    },
                    required: ['question_title', 'question_description', 'candidate_responses', 'comparative_analysis', 'best_response']
                  }
                },
                interview_performance_analysis: {
                  type: 'array',
                  description: 'Analysis of interview performance for candidates who have been interviewed',
                  items: {
                    type: 'object',
                    properties: {
                      application_id: { type: 'string' },
                      candidate_name: { type: 'string' },
                      has_interview: { type: 'boolean', description: 'Whether this candidate has interview data' },
                      interview_score: { type: 'number', description: 'Overall interview performance score 0-100' },
                      application_vs_interview: { 
                        type: 'string', 
                        description: 'How interview performance compared to application materials (e.g., "Exceeded expectations", "Met expectations", "Below expectations")' 
                      },
                      key_observations: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Key observations from the interview'
                      },
                      score_trajectory: {
                        type: 'object',
                        properties: {
                          initial_score: { type: 'number' },
                          final_score: { type: 'number' },
                          change: { type: 'number' },
                          explanation: { type: 'string' }
                        }
                      },
                      strengths_demonstrated: { type: 'array', items: { type: 'string' } },
                      concerns_raised: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['application_id', 'candidate_name', 'has_interview']
                  }
                }
              },
              required: ['executive_summary', 'rankings', 'comparison_matrix', 'recommendation', 'risks', 'business_case_analysis', 'interview_performance_analysis']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_comparison_result' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to get AI comparison');
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const comparisonResult = JSON.parse(toolCall.function.arguments);

    // Save comparison to database
    let comparisonId = null;
    if (createdBy) {
      const { data: savedComparison, error: saveError } = await supabase
        .from('candidate_comparisons')
        .insert({
          job_id: jobId,
          application_ids: applicationIds,
          evaluation_prompt: customPrompt || null,
          comparison_result: comparisonResult,
          status: 'completed',
          created_by: createdBy,
        })
        .select('id')
        .single();

      if (saveError) {
        console.error('Error saving comparison:', saveError);
      } else {
        comparisonId = savedComparison.id;
        console.log('Comparison saved with ID:', comparisonId);
      }
    }

    console.log('Comparison completed successfully for', candidatesData.length, 'candidates');

    return new Response(JSON.stringify({
      success: true,
      comparison: comparisonResult,
      comparisonId,
      candidates: candidatesData.map(c => ({
        application_id: c.application_id,
        candidate_name: c.candidate_name,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in compare-candidates:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
