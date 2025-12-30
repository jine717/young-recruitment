import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum video size for Gemini inline_data (20MB)
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

/**
 * Convert an ArrayBuffer to a base64-encoded string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Determine the correct MIME type based on file extension
 */
function getMimeType(videoPath: string | null): string {
  if (!videoPath) return 'video/webm';
  const lowerPath = videoPath.toLowerCase();
  if (lowerPath.endsWith('.mp4')) return 'video/mp4';
  if (lowerPath.endsWith('.webm')) return 'video/webm';
  if (lowerPath.endsWith('.mov')) return 'video/quicktime';
  // Default to webm for browser-recorded videos
  return 'video/webm';
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

    let base64Audio: string;
    let detectedMimeType: string;

    // If videoPath is provided, download from private storage
    if (videoPath) {
      console.log('Downloading video from private storage:', videoPath);
      
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

      const { data: videoData, error: downloadError } = await supabase.storage
        .from('business-case-videos')
        .download(videoPath);

      if (downloadError) {
        console.error('Failed to download video:', downloadError);
        return new Response(
          JSON.stringify({ error: `Failed to download video: ${downloadError.message}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!videoData) {
        console.error('No video data received from storage');
        return new Response(
          JSON.stringify({ error: 'Video file not found in storage.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const videoBuffer = await videoData.arrayBuffer();
      const fileSizeMB = (videoBuffer.byteLength / 1024 / 1024).toFixed(1);
      console.log('Video downloaded, size:', videoBuffer.byteLength, 'bytes', `(${fileSizeMB}MB)`);

      // Check file size limit
      if (videoBuffer.byteLength > MAX_VIDEO_SIZE) {
        console.error(`Video too large: ${videoBuffer.byteLength} bytes (max: ${MAX_VIDEO_SIZE})`);
        return new Response(
          JSON.stringify({ 
            error: `Video file too large (${fileSizeMB}MB). Maximum size is 20MB. Please re-record a shorter response.` 
          }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      base64Audio = arrayBufferToBase64(videoBuffer);
      detectedMimeType = contentType || getMimeType(videoPath);
    } else if (audio) {
      // Legacy: audio passed directly as base64
      base64Audio = audio;
      detectedMimeType = contentType || 'audio/webm';
    } else {
      console.error('No video source provided');
      return new Response(
        JSON.stringify({ error: 'No video source provided. Please try recording again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing audio with Gemini for transcription...');
    console.log(`Detected MIME type: ${detectedMimeType}`);
    console.log(`Language: ${language}`);
    console.log(`Base64 length: ${base64Audio.length} characters`);

    // For Gemini, use audio/* format
    const mimeType = detectedMimeType.startsWith('video/') 
      ? detectedMimeType.replace('video/', 'audio/') 
      : detectedMimeType;

    console.log(`Using MIME type for Gemini: ${mimeType}`);

    // Call Gemini with audio as inline_data - ONLY transcription
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: `You are a professional transcription specialist.

TASK: Transcribe the audio accurately in ${language}. Capture exactly what was said, including any filler words or hesitations.

Use the transcribe_audio tool to return the transcription.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Audio}`
                }
              }
            ]
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service is busy. Please try again in a few minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Try to parse error for more details
      let errorDetail = 'Unknown error';
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        errorDetail = errorText.substring(0, 200);
      }
      
      console.error('AI processing error:', errorDetail);
      return new Response(
        JSON.stringify({ error: `AI processing failed: ${errorDetail}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Gemini response received');
    
    // Extract result from tool call
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(result).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'AI did not return a transcription. The audio may be unclear or too short.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: 'Failed to parse transcription result.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!analysisResult.transcription) {
      console.error('Empty transcription in result');
      return new Response(
        JSON.stringify({ error: 'Transcription returned empty. The audio may be silent or unclear.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        // Don't fail the request - return the transcription anyway
        console.warn('Transcription generated but failed to save to database');
      } else {
        console.log('Transcription saved to database for response:', responseId);
      }
    }

    return new Response(
      JSON.stringify({
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