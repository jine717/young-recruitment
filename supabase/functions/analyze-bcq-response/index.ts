import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responseId } = await req.json();
    
    if (!responseId) {
      throw new Error('responseId is required');
    }

    console.log('Analyzing BCQ response:', responseId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the response with its business case question
    const { data: response, error: responseError } = await supabase
      .from('business_case_responses')
      .select(`
        id,
        transcription,
        business_case_id,
        business_cases (
          question_title,
          question_description
        )
      `)
      .eq('id', responseId)
      .single();

    if (responseError || !response) {
      throw new Error(`Failed to fetch response: ${responseError?.message}`);
    }

    if (!response.transcription) {
      throw new Error('No transcription available for analysis');
    }

    const businessCase = response.business_cases as any;
    const question = `${businessCase.question_title}\n${businessCase.question_description}`;
    const transcription = response.transcription;

    console.log('Question:', question);
    console.log('Transcription length:', transcription.length);

    // Update status to analyzing
    await supabase
      .from('business_case_responses')
      .update({ content_analysis_status: 'analyzing' })
      .eq('id', responseId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Analyze with Gemini - BOTH content quality AND English fluency
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert recruitment analyst evaluating candidate responses to business case questions.

You will perform TWO types of analysis:

1. CONTENT QUALITY ANALYSIS: Evaluate how well the candidate's response addresses the question, identify strengths, and suggest areas to probe further in an interview.

2. ENGLISH FLUENCY ANALYSIS: Based on the transcription text, evaluate the speaker's English proficiency looking at:
   - Vocabulary and word choice
   - Sentence structure and grammar
   - Clarity of expression
   - Professional language use
   - Any noticeable hesitations or filler words captured in the transcription

Be specific, constructive, and focus on actionable insights for recruiters.`
          },
          {
            role: 'user',
            content: `Analyze this candidate's response to the business case question.

QUESTION:
${question}

CANDIDATE'S RESPONSE (transcribed from video):
${transcription}

Evaluate BOTH the content quality AND English fluency. Use the analyze_response tool to provide your complete analysis.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_response',
              description: 'Provide structured analysis of content quality and English fluency',
              parameters: {
                type: 'object',
                properties: {
                  // Content Quality Analysis
                  quality_score: {
                    type: 'number',
                    description: 'Overall content quality score from 0-100 based on how well the response addresses the question'
                  },
                  strengths: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of 2-4 specific strengths demonstrated in the response'
                  },
                  areas_to_probe: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of 2-4 specific areas or follow-up questions to explore in the interview'
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief 2-3 sentence summary of the response quality and key observations'
                  },
                  // English Fluency Analysis
                  fluency_analysis: {
                    type: 'object',
                    description: 'English language fluency assessment',
                    properties: {
                      pronunciation_score: { 
                        type: 'number',
                        description: 'Vocabulary and clarity score 0-100 (based on word choices visible in transcription)'
                      },
                      pace_rhythm_score: { 
                        type: 'number',
                        description: 'Sentence flow and structure score 0-100'
                      },
                      hesitation_score: { 
                        type: 'number',
                        description: 'Fluidity score 0-100 (higher = fewer filler words/hesitations in transcription)'
                      },
                      grammar_score: { 
                        type: 'number',
                        description: 'Grammar correctness score 0-100'
                      },
                      overall_fluency_score: { 
                        type: 'number',
                        description: 'Overall English fluency score 0-100'
                      },
                      fluency_notes: { 
                        type: 'string',
                        description: 'Brief notes (1-2 sentences) on the speaker\'s English proficiency'
                      }
                    },
                    required: ['pronunciation_score', 'pace_rhythm_score', 'hesitation_score', 
                               'grammar_score', 'overall_fluency_score', 'fluency_notes']
                  }
                },
                required: ['quality_score', 'strengths', 'areas_to_probe', 'summary', 'fluency_analysis']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_response' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const result = await aiResponse.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call response from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Analysis result:', analysis);

    // Build update data with both content and fluency analysis
    const updateData: Record<string, unknown> = {
      // Content quality fields
      content_quality_score: analysis.quality_score,
      content_strengths: analysis.strengths,
      content_areas_to_probe: analysis.areas_to_probe,
      content_summary: analysis.summary,
      content_analysis_status: 'completed'
    };

    // Add fluency analysis if available
    if (analysis.fluency_analysis) {
      const fluency = analysis.fluency_analysis;
      updateData.fluency_pronunciation_score = fluency.pronunciation_score;
      updateData.fluency_pace_score = fluency.pace_rhythm_score;
      updateData.fluency_hesitation_score = fluency.hesitation_score;
      updateData.fluency_grammar_score = fluency.grammar_score;
      updateData.fluency_overall_score = fluency.overall_fluency_score;
      updateData.fluency_notes = fluency.fluency_notes;
    }

    // Save analysis to database
    const { error: updateError } = await supabase
      .from('business_case_responses')
      .update(updateData)
      .eq('id', responseId);

    if (updateError) {
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          quality_score: analysis.quality_score,
          strengths: analysis.strengths,
          areas_to_probe: analysis.areas_to_probe,
          summary: analysis.summary,
          fluency_analysis: analysis.fluency_analysis
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
