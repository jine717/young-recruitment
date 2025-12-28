import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Convert an ArrayBuffer to a base64-encoded string.
 *
 * @param buffer - The ArrayBuffer whose raw bytes will be encoded
 * @returns The base64-encoded representation of `buffer`'s bytes
 */
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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoPath, responseId, audio, contentType = 'audio/webm', language = 'en' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let base64Audio: string;

    // If videoPath is provided, download from private storage
    if (videoPath) {
      console.log('Downloading video from private storage:', videoPath);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: videoData, error: downloadError } = await supabase.storage
        .from('business-case-videos')
        .download(videoPath);

      if (downloadError) {
        throw new Error(`Failed to download video: ${downloadError.message}`);
      }

      if (!videoData) {
        throw new Error('No video data received');
      }

      const videoBuffer = await videoData.arrayBuffer();
      base64Audio = arrayBufferToBase64(videoBuffer);
      console.log('Video downloaded, size:', videoBuffer.byteLength, 'bytes');
    } else if (audio) {
      // Legacy: audio passed directly as base64
      base64Audio = audio;
    } else {
      throw new Error('Either videoPath or audio data is required');
    }

    console.log('Processing audio with Gemini for transcription...');
    console.log(`Content type: ${contentType}`);
    console.log(`Language: ${language}`);

    // Determine mime type for Gemini (use audio/* format)
    const mimeType = contentType.startsWith('video/') 
      ? contentType.replace('video/', 'audio/') 
      : contentType;

    console.log(`Using mime type: ${mimeType}`);

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
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini response received');
    
    // Extract result from tool call
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(result));
      throw new Error('No tool call response from Gemini');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    
    console.log('Transcription successful');
    console.log('Transcription length:', analysisResult.transcription?.length || 0);

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
        throw new Error(`Failed to save transcription: ${updateError.message}`);
      }

      console.log('Transcription saved to database for response:', responseId);
    }

    return new Response(
      JSON.stringify({
        text: analysisResult.transcription
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
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