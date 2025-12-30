import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Determine the correct MIME type based on file extension
 */
function getMimeType(videoPath: string | null): string {
  if (!videoPath) return 'audio/webm';
  const lowerPath = videoPath.toLowerCase();
  if (lowerPath.endsWith('.mp4')) return 'audio/mp4';
  if (lowerPath.endsWith('.webm')) return 'audio/webm';
  if (lowerPath.endsWith('.mov')) return 'audio/mp4';
  return 'audio/webm';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoPath, responseId, audio, contentType, language = 'en' } = await req.json();
    
    console.log('Transcription request received:', { 
      videoPath: videoPath ? `${videoPath.substring(0, 50)}...` : null, 
      responseId, 
      hasAudio: !!audio,
      contentType,
      language 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let audioSource: { type: 'url', url: string, mimeType: string } | { type: 'base64', data: string, mimeType: string };

    // If videoPath is provided, create a signed URL (no download needed - saves memory!)
    if (videoPath) {
      console.log('Creating signed URL for video:', videoPath);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase configuration missing');
        return new Response(
          JSON.stringify({ error: 'Storage service not configured. Please contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Create signed URL valid for 1 hour - Gemini will download directly
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('business-case-videos')
        .createSignedUrl(videoPath, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Failed to create signed URL:', signedUrlError);
        return new Response(
          JSON.stringify({ error: `Failed to access video: ${signedUrlError?.message || 'Unknown error'}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Signed URL created successfully');
      const mimeType = contentType ? contentType.replace('video/', 'audio/') : getMimeType(videoPath);
      audioSource = { type: 'url', url: signedUrlData.signedUrl, mimeType };
      
    } else if (audio) {
      // Legacy: audio passed directly as base64
      const mimeType = contentType || 'audio/webm';
      audioSource = { type: 'base64', data: audio, mimeType };
    } else {
      console.error('No video source provided');
      return new Response(
        JSON.stringify({ error: 'No video source provided. Please try recording again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing audio with Gemini for transcription...');
    console.log(`Audio source type: ${audioSource.type}`);
    console.log(`MIME type: ${audioSource.mimeType}`);
    console.log(`Language: ${language}`);

    // Build content array based on source type
    // NOTE: Lovable AI gateway uses image_url format for all media (including audio/video URLs)
    const contentArray: any[] = [
      {
        type: 'text',
        text: `You are a professional transcription specialist.

TASK: Transcribe the audio accurately in ${language}. Capture exactly what was said, including any filler words or hesitations.

Use the transcribe_audio tool to return the transcription.`
      }
    ];

    if (audioSource.type === 'url') {
      // Use image_url format with the signed URL - gateway downloads directly
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: audioSource.url
        }
      });
    } else {
      // Legacy base64 inline data
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: `data:${audioSource.mimeType};base64,${audioSource.data}`
        }
      });
    }

    // Retry logic for transient errors
    const maxRetries = 3;
    const retryDelays = [500, 1500, 3000]; // ms
    let lastError: string = '';
    let response: Response | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${retryDelays[attempt - 1]}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
      }

      // Call Gemini - ONLY transcription
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: contentArray
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'transcribe_audio',
                description: 'Return the transcription of the audio',
                parameters: {
                  type: 'object',
                  properties: {
                    transcription: {
                      type: 'string',
                      description: 'Full transcription of the audio content'
                    }
                  },
                  required: ['transcription']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'transcribe_audio' } }
        }),
      });

      // Check if we should retry (5xx errors are transient)
      if (response.status >= 500 && response.status < 600 && attempt < maxRetries - 1) {
        lastError = `Server error ${response.status}`;
        console.warn(`Transient error (${response.status}), will retry...`);
        continue;
      }
      
      // Success or non-retryable error - break out
      break;
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : lastError;
      const statusCode = response?.status || 500;
      console.error('Gemini API error:', statusCode, errorText);
      
      // Return HTTP 200 with error in body for better client handling
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ ok: false, error: 'AI service is busy. Please try again in a few minutes.', code: 429 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ ok: false, error: 'AI service credits exhausted. Please contact support.', code: 402 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Try to parse error for more details
      let errorDetail = 'Unknown error';
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        errorDetail = typeof errorText === 'string' ? errorText.substring(0, 200) : 'Server error';
      }
      
      console.error('AI processing error:', errorDetail);
      return new Response(
        JSON.stringify({ ok: false, error: `Transcription failed: ${errorDetail}. Please try again.`, code: statusCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Gemini response received');
    
    // Extract result from tool call
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(result).substring(0, 500));
      return new Response(
        JSON.stringify({ ok: false, error: 'AI did not return a transcription. The audio may be unclear or too short.', code: 422 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to parse transcription result.', code: 500 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!analysisResult.transcription) {
      console.error('Empty transcription in result');
      return new Response(
        JSON.stringify({ ok: false, error: 'Transcription returned empty. The audio may be silent or unclear.', code: 422 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcription successful');
    console.log('Transcription length:', analysisResult.transcription.length, 'characters');

    // If responseId is provided, update the database directly
    if (responseId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from('business_case_responses')
        .update({ transcription: analysisResult.transcription })
        .eq('id', responseId);

      if (updateError) {
        console.error('Failed to save transcription:', updateError);
        console.warn('Transcription generated but failed to save to database');
      } else {
        console.log('Transcription saved to database for response:', responseId);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        text: analysisResult.transcription
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: `Transcription failed: ${errorMessage}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
