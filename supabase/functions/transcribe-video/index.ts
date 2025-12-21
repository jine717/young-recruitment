import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, contentType = 'audio/webm', language = 'en' } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio with Gemini for transcription...');
    console.log(`Content type: ${contentType}`);
    console.log(`Language: ${language}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
                  url: `data:${mimeType};base64,${audio}`
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
