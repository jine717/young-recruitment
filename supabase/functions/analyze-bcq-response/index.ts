import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

    // Fetch the response with its business case question AND video_url
    const { data: response, error: responseError } = await supabase
      .from('business_case_responses')
      .select(`
        id,
        transcription,
        video_url,
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
    console.log('Video URL:', response.video_url);

    // Update status to analyzing
    await supabase
      .from('business_case_responses')
      .update({ content_analysis_status: 'analyzing' })
      .eq('id', responseId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare video for audio analysis (if available)
    // Limit video size to 7MB to avoid memory issues
    const MAX_VIDEO_SIZE_BYTES = 7 * 1024 * 1024; // 7MB
    let videoBase64: string | null = null;
    let skipFluencyReason: string | null = null;
    
    if (response.video_url) {
      try {
        console.log('Fetching video for audio analysis...');
        const videoResponse = await fetch(response.video_url);
        if (videoResponse.ok) {
          const contentLength = videoResponse.headers.get('content-length');
          const videoSize = contentLength ? parseInt(contentLength, 10) : 0;
          
          console.log('Video size:', videoSize, 'bytes (', (videoSize / 1024 / 1024).toFixed(2), 'MB)');
          
          if (videoSize > MAX_VIDEO_SIZE_BYTES) {
            console.warn(`Video too large for fluency analysis: ${(videoSize / 1024 / 1024).toFixed(2)}MB > ${(MAX_VIDEO_SIZE_BYTES / 1024 / 1024)}MB limit`);
            skipFluencyReason = `Video too large (${(videoSize / 1024 / 1024).toFixed(1)}MB)`;
          } else {
            const videoBuffer = await videoResponse.arrayBuffer();
            // Double check actual buffer size
            if (videoBuffer.byteLength > MAX_VIDEO_SIZE_BYTES) {
              console.warn(`Video buffer too large: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
              skipFluencyReason = `Video too large (${(videoBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`;
            } else {
              videoBase64 = arrayBufferToBase64(videoBuffer);
              console.log('Video fetched successfully, base64 length:', videoBase64.length);
            }
          }
        } else {
          console.warn('Failed to fetch video:', videoResponse.status);
          skipFluencyReason = `Failed to fetch video: ${videoResponse.status}`;
        }
      } catch (videoError) {
        console.warn('Error fetching video:', videoError);
        skipFluencyReason = `Error fetching video: ${videoError instanceof Error ? videoError.message : 'Unknown'}`;
      }
    }

    // Run BOTH analyses in parallel:
    // 1. Content Quality Analysis (from transcription text)
    // 2. English Fluency Analysis (from actual video/audio)
    
    const contentAnalysisPromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

Evaluate how well the candidate's response addresses the question, identify strengths, and suggest areas to probe further in an interview.

Be specific, constructive, and focus on actionable insights for recruiters.`
          },
          {
            role: 'user',
            content: `Analyze this candidate's response to the business case question.

QUESTION:
${question}

CANDIDATE'S RESPONSE (transcribed from video):
${transcription}

Evaluate the content quality of this response. Use the analyze_content tool to provide your analysis.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_content',
              description: 'Provide structured analysis of content quality',
              parameters: {
                type: 'object',
                properties: {
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
                  }
                },
                required: ['quality_score', 'strengths', 'areas_to_probe', 'summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_content' } }
      }),
    });

    // English Fluency Analysis from VIDEO/AUDIO (if video available)
    let fluencyAnalysisPromise: Promise<Response> | null = null;
    
    if (videoBase64) {
      console.log('Analyzing English fluency from audio...');
      fluencyAnalysisPromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are an expert English language evaluator. Listen carefully to this video recording and evaluate the speaker's English fluency based on their ACTUAL SPOKEN AUDIO.

Evaluate the following aspects of their spoken English:
1. PRONUNCIATION: Clarity of speech, accent clarity, word pronunciation accuracy
2. PACE & RHYTHM: Speaking speed, natural rhythm, pauses, flow of speech
3. HESITATIONS: Frequency of "um", "uh", pauses, restarts, or filler words
4. GRAMMAR: Grammatical correctness in spoken sentences
5. OVERALL FLUENCY: Overall impression of English speaking ability

Important: Base your evaluation ONLY on the audio/speech quality, NOT on the content of what they're saying.

Use the analyze_fluency tool to provide your assessment.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:video/webm;base64,${videoBase64}`
                  }
                }
              ]
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'analyze_fluency',
                description: 'Provide structured analysis of English fluency from audio',
                parameters: {
                  type: 'object',
                  properties: {
                    pronunciation_score: { 
                      type: 'number',
                      description: 'Pronunciation clarity and accuracy score 0-100'
                    },
                    pace_rhythm_score: { 
                      type: 'number',
                      description: 'Speaking pace, rhythm and flow score 0-100'
                    },
                    hesitation_score: { 
                      type: 'number',
                      description: 'Fluidity score 0-100 (higher = fewer filler words, um, uh, pauses)'
                    },
                    grammar_score: { 
                      type: 'number',
                      description: 'Spoken grammar correctness score 0-100'
                    },
                    overall_fluency_score: { 
                      type: 'number',
                      description: 'Overall English fluency score 0-100'
                    },
                    fluency_notes: { 
                      type: 'string',
                      description: 'Brief notes (2-3 sentences) on the speaker\'s English proficiency, pronunciation patterns, and speaking style'
                    }
                  },
                  required: ['pronunciation_score', 'pace_rhythm_score', 'hesitation_score', 
                             'grammar_score', 'overall_fluency_score', 'fluency_notes']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'analyze_fluency' } }
        }),
      });
    }

    // Wait for both analyses
    const [contentResponse, fluencyResponse] = await Promise.all([
      contentAnalysisPromise,
      fluencyAnalysisPromise
    ]);

    // Process content analysis
    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('Content AI API error:', errorText);
      throw new Error(`Content AI API error: ${errorText}`);
    }

    const contentResult = await contentResponse.json();
    const contentToolCall = contentResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!contentToolCall) {
      throw new Error('No tool call response from content AI');
    }

    const contentAnalysis = JSON.parse(contentToolCall.function.arguments);
    console.log('Content analysis result:', contentAnalysis);

    // Process fluency analysis (if available)
    let fluencyAnalysis = null;
    if (fluencyResponse) {
      if (!fluencyResponse.ok) {
        const errorText = await fluencyResponse.text();
        console.error('Fluency AI API error:', errorText);
        // Don't throw - continue with just content analysis
      } else {
        const fluencyResult = await fluencyResponse.json();
        const fluencyToolCall = fluencyResult.choices?.[0]?.message?.tool_calls?.[0];
        
        if (fluencyToolCall) {
          fluencyAnalysis = JSON.parse(fluencyToolCall.function.arguments);
          console.log('Fluency analysis result (from audio):', fluencyAnalysis);
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      // Content quality fields
      content_quality_score: contentAnalysis.quality_score,
      content_strengths: contentAnalysis.strengths,
      content_areas_to_probe: contentAnalysis.areas_to_probe,
      content_summary: contentAnalysis.summary,
      content_analysis_status: 'completed'
    };

    // Add fluency analysis if available
    if (fluencyAnalysis) {
      updateData.fluency_pronunciation_score = fluencyAnalysis.pronunciation_score;
      updateData.fluency_pace_score = fluencyAnalysis.pace_rhythm_score;
      updateData.fluency_hesitation_score = fluencyAnalysis.hesitation_score;
      updateData.fluency_grammar_score = fluencyAnalysis.grammar_score;
      updateData.fluency_overall_score = fluencyAnalysis.overall_fluency_score;
      updateData.fluency_notes = fluencyAnalysis.fluency_notes;
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
          quality_score: contentAnalysis.quality_score,
          strengths: contentAnalysis.strengths,
          areas_to_probe: contentAnalysis.areas_to_probe,
          summary: contentAnalysis.summary,
          fluency_analysis: fluencyAnalysis
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to update status to 'error' so it doesn't stay stuck in 'analyzing'
    try {
      const { responseId } = await req.clone().json().catch(() => ({ responseId: null }));
      if (responseId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('business_case_responses')
          .update({ content_analysis_status: 'error' })
          .eq('id', responseId);
        
        console.log('Updated status to error for response:', responseId);
      }
    } catch (updateError) {
      console.error('Failed to update status to error:', updateError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
