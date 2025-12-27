import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Validating PDF file...');
    
    // Get the file from FormData
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      console.log('No file provided in request');
      return new Response(
        JSON.stringify({ valid: false, error: 'No file provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Check content-type
    const hasValidType = file.type === 'application/pdf';
    if (!hasValidType) {
      console.log(`Invalid content-type: ${file.type}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid file type. Only PDF documents are accepted.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Read the first bytes to check PDF magic bytes
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer.slice(0, 5));
    
    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    const pdfMagicBytes = [0x25, 0x50, 0x44, 0x46, 0x2D];
    const isPdfMagic = pdfMagicBytes.every((byte, i) => uint8Array[i] === byte);

    if (!isPdfMagic) {
      console.log('File does not have valid PDF magic bytes');
      console.log(`First 5 bytes: ${Array.from(uint8Array).map(b => '0x' + b.toString(16)).join(' ')}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'The file does not appear to be a valid PDF document.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      console.log(`File too large: ${file.size} bytes (max: ${maxSize})`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'File size exceeds the maximum limit of 2MB.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('PDF validation successful');
    
    return new Response(
      JSON.stringify({ 
        valid: true, 
        fileName: file.name,
        fileSize: file.size 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error validating PDF:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'An error occurred while validating the file.' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
