import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Get file extension for FormData filename
 */
function getFileExtension(videoPath: string | null): string {
  if (!videoPath) return 'webm';
  const lowerPath = videoPath.toLowerCase();
  if (lowerPath.endsWith('.mp4')) return 'mp4';
  if (lowerPath.endsWith('.mov')) return 'mov';
  return 'webm';
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ ok: false, error: 'AI service not configured. Please contact support.', code: 500 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let audioBlob: Blob;
    let filename: string;

    // If videoPath is provided, download the video from Supabase Storage
    if (videoPath) {
      console.log('Downloading video from storage:', videoPath);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase configuration missing');
        return new Response(
          JSON.stringify({ ok: false, error: 'Storage service not configured. Please contact support.', code: 500 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Download the video file
      const { data: videoData, error: downloadError } = await supabase.storage
        .from('business-case-videos')
        .download(videoPath);

      if (downloadError || !videoData) {
        console.error('Failed to download video:', downloadError);
        return new Response(
          JSON.stringify({ ok: false, error: `Failed to access video: ${downloadError?.message || 'Unknown error'}`, code: 404 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check file size (Whisper limit is 25MB)
      const fileSizeMB = videoData.size / (1024 * 1024);
      console.log(`Video downloaded, size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 25) {
        console.error(`Video too large: ${fileSizeMB.toFixed(2)} MB`);
        return new Response(
          JSON.stringify({ ok: false, error: `Video is too large (${fileSizeMB.toFixed(1)} MB). Maximum size is 25 MB.`, code: 413 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      audioBlob = videoData;
      const ext = getFileExtension(videoPath);
      filename = `audio.${ext}`;
      
    } else if (audio) {
      // Legacy: audio passed directly as base64
      console.log('Processing base64 audio data');
      const binaryString = atob(audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioBlob = new Blob([bytes], { type: contentType || 'audio/webm' });
      filename = 'audio.webm';
    } else {
      console.error('No video source provided');
      return new Response(
        JSON.stringify({ ok: false, error: 'No video source provided. Please try recording again.', code: 400 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending to OpenAI Whisper for transcription...');
    console.log(`Filename: ${filename}`);
    console.log(`Language: ${language}`);

    // Prepare FormData for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    formData.append('model', 'whisper-1');
    formData.append('language', language);

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

      response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
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
      console.error('Whisper API error:', statusCode, errorText);
      
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ ok: false, error: 'AI service is busy. Please try again in a few minutes.', code: 429 }),
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
      
      console.error('Whisper processing error:', errorDetail);
      return new Response(
        JSON.stringify({ ok: false, error: `Transcription failed: ${errorDetail}. Please try again.`, code: statusCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Whisper response received');
    
    const transcription = result.text;
    if (!transcription) {
      console.error('Empty transcription from Whisper');
      return new Response(
        JSON.stringify({ ok: false, error: 'Transcription returned empty. The audio may be silent or unclear.', code: 422 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcription successful');
    console.log('Transcription length:', transcription.length, 'characters');

    // If responseId is provided, update the database directly
    if (responseId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from('business_case_responses')
        .update({ transcription: transcription })
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
        text: transcription
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ ok: false, error: `Transcription failed: ${errorMessage}`, code: 500 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
