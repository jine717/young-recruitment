import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CVAnalysis {
  candidate_summary: string;
  experience_years: number;
  key_skills: string[];
  education: { degree: string; institution: string; year?: string }[];
  work_history: { company: string; role: string; duration: string }[];
  strengths: string[];
  red_flags: string[];
  overall_impression: string;
}

interface DISCAnalysis {
  profile_type: 'D' | 'I' | 'S' | 'C';
  profile_description: string;
  dominant_traits: string[];
  communication_style: string;
  work_style: string;
  strengths: string[];
  potential_challenges: string[];
  management_tips: string;
  team_fit_considerations: string;
}

const CV_ANALYSIS_PROMPT = `You are an expert HR analyst. Analyze this CV/Resume document and provide a structured analysis.

Extract and analyze:
1. A brief candidate summary (2-3 sentences)
2. Estimated years of experience
3. Key skills identified (5-10 most relevant)
4. Education history (degrees, institutions)
5. Work history (companies, roles, durations)
6. Key strengths based on the CV
7. Any potential red flags or concerns
8. Your overall impression of the candidate

Be objective and thorough in your analysis.`;

const DISC_ANALYSIS_PROMPT = `You are an expert in DISC personality assessments. Analyze this DISC assessment document and provide a structured analysis.

Identify and analyze:
1. The dominant profile type (D, I, S, or C)
2. A description of what this profile means
3. The person's dominant personality traits
4. Their preferred communication style
5. Their work style and preferences
6. Key strengths of this profile
7. Potential challenges or blind spots
8. Tips for managing/working with this person
9. Team fit considerations

Provide actionable insights for recruiters.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, documentType, documentPath } = await req.json();

    if (!applicationId || !documentType || !documentPath) {
      throw new Error('Missing required parameters: applicationId, documentType, documentPath');
    }

    if (!['cv', 'disc'].includes(documentType)) {
      throw new Error('Invalid document type. Must be "cv" or "disc"');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create or update analysis record with processing status
    const { error: upsertError } = await supabase
      .from('document_analyses')
      .upsert({
        application_id: applicationId,
        document_type: documentType,
        status: 'processing',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'application_id,document_type'
      });

    if (upsertError) {
      console.error('Error creating analysis record:', upsertError);
      throw new Error('Failed to create analysis record');
    }

    // Get signed URL for the document
    const bucketName = documentType === 'cv' ? 'cvs' : 'disc-assessments';
    
    // Extract relative path from full URL if needed
    let relativePath = documentPath;
    if (documentPath.includes('storage/v1/object/public/')) {
      // Extract path after bucket name
      const regex = new RegExp(`storage/v1/object/public/${bucketName}/(.+)$`);
      const match = documentPath.match(regex);
      if (match) {
        relativePath = match[1];
      }
    } else if (documentPath.includes('storage/v1/object/sign/')) {
      const regex = new RegExp(`storage/v1/object/sign/${bucketName}/(.+?)\\?`);
      const match = documentPath.match(regex);
      if (match) {
        relativePath = match[1];
      }
    }
    
    console.log('Document path:', documentPath);
    console.log('Relative path:', relativePath);
    console.log('Bucket:', bucketName);
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(relativePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error getting signed URL:', signedUrlError);
      throw new Error('Failed to get document URL');
    }

    // Download the document
    const documentResponse = await fetch(signedUrlData.signedUrl);
    if (!documentResponse.ok) {
      throw new Error('Failed to download document');
    }

    // For PDFs, we'll send the base64 content to the AI
    const documentBuffer = await documentResponse.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(documentBuffer)));

    // Determine content type
    const contentType = documentResponse.headers.get('content-type') || 'application/pdf';
    const isImage = contentType.startsWith('image/');
    const isPdf = contentType.includes('pdf');

    // Build the message for AI
    const systemPrompt = documentType === 'cv' ? CV_ANALYSIS_PROMPT : DISC_ANALYSIS_PROMPT;
    
    let userContent: any[];
    
    if (isImage) {
      userContent = [
        { type: 'text', text: `Please analyze this ${documentType === 'cv' ? 'CV/Resume' : 'DISC Assessment'} document:` },
        { type: 'image_url', image_url: { url: `data:${contentType};base64,${base64Content}` } }
      ];
    } else if (isPdf) {
      // For PDFs, we'll describe what we're analyzing and ask AI to extract from base64
      // Note: Some AI models can handle PDF content directly
      userContent = [
        { 
          type: 'text', 
          text: `Please analyze this ${documentType === 'cv' ? 'CV/Resume' : 'DISC Assessment'} document. The document is a PDF file encoded in base64. Extract all relevant information and provide your analysis.\n\nBase64 PDF content (first 50000 chars): ${base64Content.substring(0, 50000)}` 
        }
      ];
    } else {
      // Text content
      const textContent = new TextDecoder().decode(documentBuffer);
      userContent = [
        { type: 'text', text: `Please analyze this ${documentType === 'cv' ? 'CV/Resume' : 'DISC Assessment'} document:\n\n${textContent}` }
      ];
    }

    // Define the tool for structured output
    const analysisTools = documentType === 'cv' ? [
      {
        type: 'function',
        function: {
          name: 'analyze_cv',
          description: 'Provide structured CV analysis',
          parameters: {
            type: 'object',
            properties: {
              candidate_summary: { type: 'string', description: 'Brief 2-3 sentence summary of the candidate' },
              experience_years: { type: 'number', description: 'Estimated years of professional experience' },
              key_skills: { type: 'array', items: { type: 'string' }, description: '5-10 key skills identified' },
              education: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  properties: {
                    degree: { type: 'string' },
                    institution: { type: 'string' },
                    year: { type: 'string' }
                  },
                  required: ['degree', 'institution']
                }
              },
              work_history: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    company: { type: 'string' },
                    role: { type: 'string' },
                    duration: { type: 'string' }
                  },
                  required: ['company', 'role', 'duration']
                }
              },
              strengths: { type: 'array', items: { type: 'string' } },
              red_flags: { type: 'array', items: { type: 'string' } },
              overall_impression: { type: 'string' }
            },
            required: ['candidate_summary', 'experience_years', 'key_skills', 'education', 'work_history', 'strengths', 'red_flags', 'overall_impression']
          }
        }
      }
    ] : [
      {
        type: 'function',
        function: {
          name: 'analyze_disc',
          description: 'Provide structured DISC assessment analysis',
          parameters: {
            type: 'object',
            properties: {
              profile_type: { type: 'string', enum: ['D', 'I', 'S', 'C'], description: 'Dominant DISC profile type' },
              profile_description: { type: 'string', description: 'Description of what this profile means' },
              dominant_traits: { type: 'array', items: { type: 'string' } },
              communication_style: { type: 'string' },
              work_style: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              potential_challenges: { type: 'array', items: { type: 'string' } },
              management_tips: { type: 'string' },
              team_fit_considerations: { type: 'string' }
            },
            required: ['profile_type', 'profile_description', 'dominant_traits', 'communication_style', 'work_style', 'strengths', 'potential_challenges', 'management_tips', 'team_fit_considerations']
          }
        }
      }
    ];

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        tools: analysisTools,
        tool_choice: { type: 'function', function: { name: documentType === 'cv' ? 'analyze_cv' : 'analyze_disc' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Update status to failed
      await supabase
        .from('document_analyses')
        .update({ 
          status: 'failed', 
          error_message: `AI API error: ${aiResponse.status}`,
          updated_at: new Date().toISOString()
        })
        .eq('application_id', applicationId)
        .eq('document_type', documentType);
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract the analysis from tool call
    let analysis: CVAnalysis | DISCAnalysis;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      throw new Error('No structured analysis returned from AI');
    }

    // Generate summary
    const summary = documentType === 'cv' 
      ? (analysis as CVAnalysis).candidate_summary
      : `${(analysis as DISCAnalysis).profile_type} Profile: ${(analysis as DISCAnalysis).profile_description}`;

    // Update analysis record with results
    const { error: updateError } = await supabase
      .from('document_analyses')
      .update({
        status: 'completed',
        analysis: analysis,
        summary: summary,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)
      .eq('document_type', documentType);

    if (updateError) {
      console.error('Error updating analysis record:', updateError);
      throw new Error('Failed to save analysis results');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      summary 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
