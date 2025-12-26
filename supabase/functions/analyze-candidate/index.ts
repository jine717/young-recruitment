import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CandidateAnalysis {
  overall_score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendation: "proceed" | "review" | "reject";
  skills_match_score: number;
  communication_score: number;
  cultural_fit_score: number;
}

interface CVAnalysis {
  candidate_summary?: string;
  experience_years?: number;
  key_skills?: string[];
  education?: { degree: string; institution: string; year?: string }[];
  work_history?: { company: string; role: string; duration: string }[];
  strengths?: string[];
  red_flags?: string[];
  overall_impression?: string;
}

interface DISCAnalysis {
  profile_type?: string;
  profile_description?: string;
  dominant_traits?: string[];
  communication_style?: string;
  work_style?: string;
  strengths?: string[];
  potential_challenges?: string[];
  management_tips?: string;
  team_fit_considerations?: string;
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

// Helper function to analyze a single document
async function analyzeDocument(
  supabase: SupabaseClient,
  lovableApiKey: string,
  applicationId: string,
  documentType: 'cv' | 'disc',
  documentPath: string | null
): Promise<CVAnalysis | DISCAnalysis | null> {
  if (!documentPath) {
    console.log(`No ${documentType} document path available`);
    return null;
  }

  // Check if analysis already exists and is completed
  const { data: existing } = await supabase
    .from('document_analyses')
    .select('analysis, status')
    .eq('application_id', applicationId)
    .eq('document_type', documentType)
    .maybeSingle();

  if (existing?.status === 'completed' && existing?.analysis) {
    console.log(`${documentType} analysis already completed, using cached result`);
    return existing.analysis as CVAnalysis | DISCAnalysis;
  }

  console.log(`Starting ${documentType} analysis for application ${applicationId}`);

  // Create or update analysis record with processing status
  await supabase
    .from('document_analyses')
    .upsert({
      application_id: applicationId,
      document_type: documentType,
      status: 'processing',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'application_id,document_type'
    });

  try {
    // Get signed URL for the document
    const bucketName = documentType === 'cv' ? 'cvs' : 'disc-assessments';
    
    // Extract relative path from full URL if needed
    let relativePath = documentPath;
    if (documentPath.includes('storage/v1/object/public/')) {
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
    
    console.log(`${documentType} - Document path:`, documentPath);
    console.log(`${documentType} - Relative path:`, relativePath);
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(relativePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(`Error getting signed URL for ${documentType}:`, signedUrlError);
      throw new Error('Failed to get document URL');
    }

    // Download the document
    const documentResponse = await fetch(signedUrlData.signedUrl);
    if (!documentResponse.ok) {
      throw new Error('Failed to download document');
    }

    // For PDFs, we'll send the base64 content to the AI
    const documentBuffer = await documentResponse.arrayBuffer();
    // Use chunked conversion to avoid stack overflow with large files
    const uint8Array = new Uint8Array(documentBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Content = btoa(binaryString);

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
      console.log(`Processing ${documentType} PDF document, size:`, base64Content.length, 'characters');
      userContent = [
        { 
          type: 'text', 
          text: `Please carefully analyze this ${documentType === 'cv' ? 'CV/Resume' : 'DISC Assessment'} PDF document. Extract ALL information EXACTLY as it appears in the document. Do not invent or assume any data - only report what you can actually read from the document.`
        },
        { 
          type: 'image_url', 
          image_url: { 
            url: `data:application/pdf;base64,${base64Content}` 
          } 
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
      console.error(`${documentType} AI API error:`, aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log(`${documentType} AI Response received`);

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
    await supabase
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

    console.log(`${documentType} analysis completed successfully`);
    return analysis;

  } catch (error) {
    console.error(`Error analyzing ${documentType}:`, error);
    
    // Update status to failed
    await supabase
      .from('document_analyses')
      .update({ 
        status: 'failed', 
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)
      .eq('document_type', documentType);
    
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();
    
    if (!applicationId) {
      throw new Error("applicationId is required");
    }

    console.log(`Starting AI analysis for application: ${applicationId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await supabase
      .from("applications")
      .update({ ai_evaluation_status: "processing" })
      .eq("id", applicationId);

    // Fetch application with job details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        jobs (
          id,
          title,
          description,
          requirements,
          responsibilities,
          ai_system_prompt
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Failed to fetch application:", appError);
      throw new Error("Application not found");
    }

    // === STEP 1: Analyze CV and DISC documents in parallel ===
    console.log('Starting document analyses in parallel...');
    console.log(`CV URL: ${application.cv_url}`);
    console.log(`DISC URL: ${application.disc_url}`);

    const [cvAnalysis, discAnalysis] = await Promise.all([
      analyzeDocument(supabase, lovableApiKey, applicationId, 'cv', application.cv_url),
      analyzeDocument(supabase, lovableApiKey, applicationId, 'disc', application.disc_url)
    ]);

    console.log('Document analyses completed:', {
      cvAnalysis: cvAnalysis ? 'completed' : 'not available',
      discAnalysis: discAnalysis ? 'completed' : 'not available'
    });

    // Fetch candidate profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", application.candidate_id)
      .maybeSingle();

    // === STEP 2: Build prompt and run comprehensive AI evaluation ===
    const job = application.jobs;
    const prompt = buildAnalysisPrompt(job, profile, application, cvAnalysis, discAnalysis);

    console.log("Calling Lovable AI for comprehensive evaluation...");

    // Build system prompt with custom instructions if provided
    const baseSystemPrompt = `You are an expert recruitment analyst for a modern, disruptive company called Young. 
Your task is to analyze candidate applications and provide a structured initial evaluation based on their documents.

This is the INITIAL screening phase. Focus on evaluating:
1. **CV/Resume Analysis**: Experience level, years of experience, skills, education, work history, and any red flags identified
2. **DISC Personality Profile**: Personality type, communication style, work preferences, strengths, challenges, and team fit considerations

NOTE: Business Case Questions (BCQ) are evaluated in a separate later stage of the process.

Weighting guidelines for scores:
- **skills_match_score**: Heavily weight the CV analysis (experience, skills matching requirements).
- **communication_score**: Base on DISC communication style analysis. Look for clarity and professionalism indicators.
- **cultural_fit_score**: Use DISC profile traits to assess alignment with company values.

The company values: Fearless, Unusual, Down to earth, Agility, Determination, and Authenticity.
Be fair but thorough. Look for potential, growth mindset, and cultural fit based on the available documents.`;

    const customInstructions = job?.ai_system_prompt;
    const systemPrompt = customInstructions 
      ? `${baseSystemPrompt}\n\n## Custom Evaluation Instructions from Recruiter\n${customInstructions}`
      : baseSystemPrompt;

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_evaluation",
              description: "Submit the candidate evaluation with scores and analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "2-3 sentence summary of the candidate including experience level and personality fit",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key strengths identified from CV and DISC profile",
                  },
                  concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 concerns or areas to probe in interview, including any CV red flags or DISC challenges",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["proceed", "review", "reject"],
                    description: "Recommendation for next steps based on document analysis",
                  },
                  skills_match_score: {
                    type: "number",
                    description: "How well skills and experience match requirements (0-100), based on CV analysis",
                  },
                  communication_score: {
                    type: "number",
                    description: "Predicted communication quality (0-100), based on DISC communication style",
                  },
                  cultural_fit_score: {
                    type: "number",
                    description: "Alignment with company values (0-100), based on DISC profile traits",
                  },
                },
                required: [
                  "summary",
                  "strengths",
                  "concerns",
                  "recommendation",
                  "skills_match_score",
                  "communication_score",
                  "cultural_fit_score",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        await supabase
          .from("applications")
          .update({ ai_evaluation_status: "failed" })
          .eq("id", applicationId);
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the evaluation from tool call
    let evaluation: CandidateAnalysis;
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      evaluation = JSON.parse(toolCall.function.arguments);
    } else {
      console.error("Unexpected AI response format:", aiData);
      throw new Error("Failed to parse AI response");
    }

    // Calculate overall_score from sub-scores using weighted average
    // Skills Match (40%) + Communication (30%) + Cultural Fit (30%)
    const calculatedOverallScore = Math.round(
      (evaluation.skills_match_score * 0.40) +
      (evaluation.communication_score * 0.30) +
      (evaluation.cultural_fit_score * 0.30)
    );
    evaluation.overall_score = calculatedOverallScore;

    console.log("Evaluation parsed with calculated overall_score:", evaluation);

    // Store the evaluation - including initial scores for preservation across stages
    const { error: evalError } = await supabase.from("ai_evaluations").upsert({
      application_id: applicationId,
      overall_score: evaluation.overall_score,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      concerns: evaluation.concerns,
      recommendation: evaluation.recommendation,
      skills_match_score: evaluation.skills_match_score,
      communication_score: evaluation.communication_score,
      cultural_fit_score: evaluation.cultural_fit_score,
      raw_response: aiData,
      // Save as initial scores for preservation across evaluation stages
      initial_overall_score: evaluation.overall_score,
      initial_skills_match_score: evaluation.skills_match_score,
      initial_communication_score: evaluation.communication_score,
      initial_cultural_fit_score: evaluation.cultural_fit_score,
      initial_recommendation: evaluation.recommendation,
      evaluation_stage: 'initial',
    }, { onConflict: "application_id" });

    if (evalError) {
      console.error("Failed to store evaluation:", evalError);
      throw new Error("Failed to store evaluation");
    }

    // Update application with score and status
    await supabase
      .from("applications")
      .update({
        ai_score: evaluation.overall_score,
        ai_evaluation_status: "completed",
        status: "under_review",
      })
      .eq("id", applicationId);

    console.log(`AI analysis completed for application: ${applicationId}`);

    return new Response(
      JSON.stringify({ success: true, evaluation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-candidate:", error);
    
    // Try to update status to failed
    try {
      const { applicationId } = await req.clone().json();
      if (applicationId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("applications")
          .update({ ai_evaluation_status: "failed" })
          .eq("id", applicationId);
      }
    } catch (e) {
      console.error("Failed to update status to failed:", e);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildAnalysisPrompt(
  job: { title: string; description: string; requirements: string[] | null; responsibilities: string[] | null; ai_system_prompt?: string | null } | null,
  profile: { full_name: string | null; email: string | null } | null,
  application: { candidate_name: string | null; candidate_email: string | null } | null,
  cvAnalysis: CVAnalysis | null,
  discAnalysis: DISCAnalysis | null
): string {
  // Use application candidate info if profile not available (anonymous applications)
  const candidateName = profile?.full_name || application?.candidate_name || "Unknown";
  
  let prompt = `## Candidate Evaluation Request

**Candidate:** ${candidateName}
**Position:** ${job?.title || "Unknown Position"}

### Job Description
${job?.description || "No description provided"}

### Requirements
${job?.requirements?.map((r, i) => `${i + 1}. ${r}`).join("\n") || "No specific requirements listed"}

### Responsibilities
${job?.responsibilities?.map((r, i) => `${i + 1}. ${r}`).join("\n") || "No specific responsibilities listed"}

`;

  // === CV ANALYSIS SECTION ===
  prompt += `### CV/Resume Analysis\n\n`;
  
  if (cvAnalysis) {
    if (cvAnalysis.candidate_summary) {
      prompt += `**Summary:** ${cvAnalysis.candidate_summary}\n\n`;
    }
    
    if (cvAnalysis.experience_years !== undefined) {
      prompt += `**Years of Experience:** ${cvAnalysis.experience_years} years\n\n`;
    }
    
    if (cvAnalysis.key_skills && cvAnalysis.key_skills.length > 0) {
      prompt += `**Key Skills:**\n${cvAnalysis.key_skills.map(s => `- ${s}`).join("\n")}\n\n`;
    }
    
    if (cvAnalysis.education && cvAnalysis.education.length > 0) {
      prompt += `**Education:**\n${cvAnalysis.education.map(e => `- ${e.degree} at ${e.institution}${e.year ? ` (${e.year})` : ""}`).join("\n")}\n\n`;
    }
    
    if (cvAnalysis.work_history && cvAnalysis.work_history.length > 0) {
      prompt += `**Work History:**\n${cvAnalysis.work_history.map(w => `- ${w.role} at ${w.company} (${w.duration})`).join("\n")}\n\n`;
    }
    
    if (cvAnalysis.strengths && cvAnalysis.strengths.length > 0) {
      prompt += `**CV Strengths:** ${cvAnalysis.strengths.join(", ")}\n\n`;
    }
    
    if (cvAnalysis.red_flags && cvAnalysis.red_flags.length > 0) {
      prompt += `**Red Flags Identified:** ${cvAnalysis.red_flags.join(", ")}\n\n`;
    }
    
    if (cvAnalysis.overall_impression) {
      prompt += `**Overall CV Impression:** ${cvAnalysis.overall_impression}\n\n`;
    }
  } else {
    prompt += `No CV analysis available. Skills evaluation will be limited.\n\n`;
  }

  // === DISC ANALYSIS SECTION ===
  prompt += `### DISC Personality Profile\n\n`;
  
  if (discAnalysis) {
    if (discAnalysis.profile_type) {
      prompt += `**Profile Type:** ${discAnalysis.profile_type}\n`;
    }
    
    if (discAnalysis.profile_description) {
      prompt += `**Description:** ${discAnalysis.profile_description}\n\n`;
    }
    
    if (discAnalysis.dominant_traits && discAnalysis.dominant_traits.length > 0) {
      prompt += `**Dominant Traits:** ${discAnalysis.dominant_traits.join(", ")}\n\n`;
    }
    
    if (discAnalysis.communication_style) {
      prompt += `**Communication Style:** ${discAnalysis.communication_style}\n\n`;
    }
    
    if (discAnalysis.work_style) {
      prompt += `**Work Style:** ${discAnalysis.work_style}\n\n`;
    }
    
    if (discAnalysis.strengths && discAnalysis.strengths.length > 0) {
      prompt += `**Personality Strengths:** ${discAnalysis.strengths.join(", ")}\n\n`;
    }
    
    if (discAnalysis.potential_challenges && discAnalysis.potential_challenges.length > 0) {
      prompt += `**Potential Challenges:** ${discAnalysis.potential_challenges.join(", ")}\n\n`;
    }
    
    if (discAnalysis.team_fit_considerations) {
      prompt += `**Team Fit Considerations:** ${discAnalysis.team_fit_considerations}\n\n`;
    }
    
    if (discAnalysis.management_tips) {
      prompt += `**Management Tips:** ${discAnalysis.management_tips}\n\n`;
    }
  } else {
    prompt += `No DISC assessment available. Personality and communication evaluation will be limited.\n\n`;
  }

  prompt += `
### Evaluation Instructions
This is the INITIAL document-based screening. Please analyze this candidate using the CV and DISC documents and provide:
1. An overall compatibility score (0-100) - based on CV experience and DISC personality fit
2. A brief summary (2-3 sentences) that captures their experience level and personality type
3. Key strengths (3-5 points) identified from CV and DISC profile
4. Concerns or areas to probe in interview (1-3 points) including any red flags from CV or DISC challenges
5. Your recommendation (proceed/review/reject) for moving to the next stage
6. Individual scores for skills match, communication potential, and cultural fit

NOTE: Business Case Questions (BCQ) will be evaluated separately in a later stage.

Use the submit_evaluation function to provide your structured analysis.`;

  return prompt;
}
