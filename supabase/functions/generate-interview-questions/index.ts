import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();
    
    if (!applicationId) {
      throw new Error('applicationId is required');
    }

    console.log('Generating interview questions for application:', applicationId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch application with job details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        candidate_id,
        job_id,
        jobs (
          id,
          title,
          requirements,
          responsibilities
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('Error fetching application:', appError);
      throw new Error('Application not found');
    }

    // Fetch AI evaluation
    const { data: aiEvaluation } = await supabase
      .from('ai_evaluations')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();

    // Fetch business case responses
    const { data: responses } = await supabase
      .from('business_case_responses')
      .select(`
        id,
        text_response,
        video_url,
        business_cases (
          question_title,
          question_description
        )
      `)
      .eq('application_id', applicationId);

    // Fetch candidate profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', application.candidate_id)
      .single();

    const job = application.jobs as any;

    // Build context for AI
    const responsesContext = (responses || []).map((r: any, idx: number) => {
      const bc = r.business_cases;
      return `Question ${idx + 1}: ${bc?.question_title || 'N/A'}
Description: ${bc?.question_description || 'N/A'}
Candidate Response: ${r.text_response || (r.video_url ? '[Video response provided]' : 'No response')}`;
    }).join('\n\n');

    const aiContext = aiEvaluation ? `
AI EVALUATION SUMMARY:
- Overall Score: ${aiEvaluation.overall_score}/100
- Skills Match: ${aiEvaluation.skills_match_score}/100
- Communication: ${aiEvaluation.communication_score}/100
- Cultural Fit: ${aiEvaluation.cultural_fit_score}/100
- Recommendation: ${aiEvaluation.recommendation}

STRENGTHS IDENTIFIED:
${(aiEvaluation.strengths || []).map((s: string) => `- ${s}`).join('\n')}

CONCERNS TO PROBE:
${(aiEvaluation.concerns || []).map((c: string) => `- ${c}`).join('\n')}

SUMMARY: ${aiEvaluation.summary || 'N/A'}
` : 'No AI evaluation available yet.';

    const prompt = `You are an expert recruitment interviewer preparing questions for a candidate interview.

CANDIDATE: ${profile?.full_name || 'Unknown'}

JOB POSITION: ${job.title}

JOB REQUIREMENTS:
${(job.requirements || []).map((r: string) => `- ${r}`).join('\n')}

JOB RESPONSIBILITIES:
${(job.responsibilities || []).map((r: string) => `- ${r}`).join('\n')}

${aiContext}

BUSINESS CASE RESPONSES:
${responsesContext || 'No business case responses available.'}

Based on all this information, generate 6-8 targeted interview questions that will help the recruiter:
1. Verify the candidate's claimed skills and experience
2. Probe into any concerns or red flags identified
3. Assess cultural fit and motivation
4. Understand their problem-solving approach
5. Clarify any gaps or ambiguities in their responses

For each question, provide:
- The question text
- Category (skills_verification, concern_probing, cultural_fit, experience, motivation)
- Brief reasoning for why this question is important
- Priority (1=must ask, 2=recommended, 3=if time permits)`;

    console.log('Calling Lovable AI for question generation...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert recruitment interviewer. Generate targeted, insightful interview questions.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_interview_questions',
              description: 'Generate structured interview questions for a candidate',
              parameters: {
                type: 'object',
                properties: {
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question_text: { type: 'string' },
                        category: { 
                          type: 'string', 
                          enum: ['skills_verification', 'concern_probing', 'cultural_fit', 'experience', 'motivation']
                        },
                        reasoning: { type: 'string' },
                        priority: { type: 'number' }
                      },
                      additionalProperties: false
                    }
                  }
                },
                required: ['questions']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_interview_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract questions from tool call
    let questions: any[] = [];
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        questions = parsed.questions || [];
      } catch (e) {
        console.error('Error parsing AI response:', e);
        throw new Error('Failed to parse AI response');
      }
    }

    if (questions.length === 0) {
      throw new Error('No questions generated');
    }

    console.log(`Generated ${questions.length} interview questions`);

    // Delete existing questions for this application
    await supabase
      .from('interview_questions')
      .delete()
      .eq('application_id', applicationId);

    // Insert new questions
    const questionsToInsert = questions.map((q: any) => ({
      application_id: applicationId,
      question_text: q.question_text,
      category: q.category,
      reasoning: q.reasoning,
      priority: q.priority
    }));

    const { error: insertError } = await supabase
      .from('interview_questions')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Error inserting questions:', insertError);
      throw new Error('Failed to save interview questions');
    }

    console.log('Interview questions saved successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      questionsCount: questions.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-interview-questions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
