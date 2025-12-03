import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandidateData {
  application_id: string;
  candidate_name: string;
  candidate_email: string;
  ai_score: number | null;
  ai_evaluation: {
    overall_score: number | null;
    skills_match_score: number | null;
    communication_score: number | null;
    cultural_fit_score: number | null;
    summary: string | null;
    strengths: string[] | null;
    concerns: string[] | null;
    recommendation: string | null;
  } | null;
  business_case_responses: {
    question_title: string;
    text_response: string | null;
  }[];
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

    if (applicationIds.length > 5) {
      throw new Error('Maximum 5 candidates can be compared at once');
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

    // Fetch candidates data
    const candidatesData: CandidateData[] = [];

    for (const appId of applicationIds) {
      // Get application
      const { data: app, error: appError } = await supabase
        .from('applications')
        .select('id, candidate_name, candidate_email, ai_score')
        .eq('id', appId)
        .single();

      if (appError) continue;

      // Get AI evaluation
      const { data: aiEval } = await supabase
        .from('ai_evaluations')
        .select('*')
        .eq('application_id', appId)
        .maybeSingle();

      // Get business case responses
      const { data: responses } = await supabase
        .from('business_case_responses')
        .select(`
          text_response,
          business_cases!inner(question_title)
        `)
        .eq('application_id', appId);

      candidatesData.push({
        application_id: app.id,
        candidate_name: app.candidate_name,
        candidate_email: app.candidate_email,
        ai_score: app.ai_score,
        ai_evaluation: aiEval ? {
          overall_score: aiEval.overall_score,
          skills_match_score: aiEval.skills_match_score,
          communication_score: aiEval.communication_score,
          cultural_fit_score: aiEval.cultural_fit_score,
          summary: aiEval.summary,
          strengths: aiEval.strengths,
          concerns: aiEval.concerns,
          recommendation: aiEval.recommendation,
        } : null,
        business_case_responses: responses?.map(r => ({
          question_title: (r.business_cases as any).question_title,
          text_response: r.text_response,
        })) || [],
      });
    }

    if (candidatesData.length < 2) {
      throw new Error('Could not fetch enough candidate data for comparison');
    }

    // Build comparison prompt
    const candidatesInfo = candidatesData.map((c, i) => `
### Candidate ${i + 1}: ${c.candidate_name}
- AI Overall Score: ${c.ai_evaluation?.overall_score ?? 'N/A'}/100
- Skills Match: ${c.ai_evaluation?.skills_match_score ?? 'N/A'}/100
- Communication: ${c.ai_evaluation?.communication_score ?? 'N/A'}/100
- Cultural Fit: ${c.ai_evaluation?.cultural_fit_score ?? 'N/A'}/100
- AI Recommendation: ${c.ai_evaluation?.recommendation ?? 'N/A'}
- Summary: ${c.ai_evaluation?.summary ?? 'No summary available'}
- Strengths: ${c.ai_evaluation?.strengths?.join(', ') ?? 'None identified'}
- Concerns: ${c.ai_evaluation?.concerns?.join(', ') ?? 'None identified'}

Business Case Responses:
${c.business_case_responses.map(r => `Q: ${r.question_title}\nA: ${r.text_response || 'No response'}`).join('\n\n')}
`).join('\n---\n');

    const systemPrompt = `You are an expert recruitment analyst for Young, a company that values: Fearless, Unusual, Down to earth, Agility, Determination, and Authenticity.

Your task is to compare final candidates for a position and provide a clear, actionable recommendation.

Job Position: ${job.title}
Job Description: ${job.description}
Requirements: ${job.requirements?.join(', ') || 'Not specified'}

${customPrompt ? `\n### Custom Evaluation Instructions from Recruiter:\n${customPrompt}\n` : ''}

Analyze the candidates objectively considering:
1. Skills match with job requirements
2. Communication quality from their responses
3. Cultural fit with Young's values
4. Growth potential and learning agility
5. Risk factors and concerns

Be direct and decisive in your recommendation.`;

    const userPrompt = `Compare these ${candidatesData.length} candidates and provide your analysis:

${candidatesInfo}

Provide a comprehensive comparison with a clear winner recommendation.`;

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
            description: 'Provide structured comparison of candidates',
            parameters: {
              type: 'object',
              properties: {
                executive_summary: {
                  type: 'string',
                  description: 'Brief 2-3 sentence summary of the comparison outcome'
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
                    justification: { type: 'string', description: 'Detailed reason for recommendation' },
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
                }
              },
              required: ['executive_summary', 'rankings', 'comparison_matrix', 'recommendation', 'risks']
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
