import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Fetch business case responses
    const { data: responses, error: respError } = await supabase
      .from("business_case_responses")
      .select(`
        *,
        business_cases (
          question_title,
          question_description,
          question_number
        )
      `)
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    if (respError) {
      console.error("Failed to fetch responses:", respError);
      throw new Error("Failed to fetch business case responses");
    }

    // Fetch candidate profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", application.candidate_id)
      .maybeSingle();

    // Fetch document analyses (CV and DISC)
    const { data: documentAnalyses } = await supabase
      .from("document_analyses")
      .select("document_type, analysis, status")
      .eq("application_id", applicationId)
      .eq("status", "completed");

    const cvAnalysis = documentAnalyses?.find(d => d.document_type === "cv")?.analysis as CVAnalysis | null;
    const discAnalysis = documentAnalyses?.find(d => d.document_type === "disc")?.analysis as DISCAnalysis | null;

    console.log(`Document analyses found - CV: ${!!cvAnalysis}, DISC: ${!!discAnalysis}`);

    // Build the analysis prompt
    const job = application.jobs;
    const prompt = buildAnalysisPrompt(job, responses || [], profile, cvAnalysis, discAnalysis);

    console.log("Calling Lovable AI for analysis...");

    // Build system prompt with custom instructions if provided
    const baseSystemPrompt = `You are an expert recruitment analyst for a modern, disruptive company called Young. 
Your task is to analyze candidate applications comprehensively and provide a structured evaluation.

Consider ALL available information in your evaluation:
1. **CV/Resume Analysis**: Experience level, years of experience, skills, education, work history, and any red flags identified
2. **DISC Personality Profile**: Personality type, communication style, work preferences, strengths, challenges, and team fit considerations
3. **Business Case Responses**: How they approach problems, quality of communication, depth of thinking, and alignment with the role

Weighting guidelines for scores:
- **skills_match_score**: Heavily weight the CV analysis (experience, skills matching requirements). If no CV analysis, base on responses.
- **communication_score**: Consider both written responses AND DISC communication style. Look at clarity, structure, and professionalism.
- **cultural_fit_score**: Use DISC profile traits (if available) alongside response content. Consider alignment with company values.

The company values: Fearless, Unusual, Down to earth, Agility, Determination, and Authenticity.
Be fair but thorough. Look for potential, growth mindset, and cultural fit.`;

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
                  overall_score: {
                    type: "number",
                    description: "Overall compatibility score from 0-100, considering CV, DISC, and responses",
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence summary of the candidate including experience level and personality fit",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key strengths identified from CV, DISC profile, and responses",
                  },
                  concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 concerns or areas to probe, including any CV red flags or DISC challenges",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["proceed", "review", "reject"],
                    description: "Recommendation for next steps based on complete profile analysis",
                  },
                  skills_match_score: {
                    type: "number",
                    description: "How well skills and experience match requirements (0-100), based primarily on CV analysis",
                  },
                  communication_score: {
                    type: "number",
                    description: "Quality of communication (0-100), considering responses and DISC communication style",
                  },
                  cultural_fit_score: {
                    type: "number",
                    description: "Alignment with company values (0-100), using DISC profile and response content",
                  },
                },
                required: [
                  "overall_score",
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

    console.log("Evaluation parsed:", evaluation);

    // Store the evaluation
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
  responses: Array<{
    text_response: string | null;
    video_url: string | null;
    business_cases: { question_title: string; question_description: string; question_number: number } | null;
  }>,
  profile: { full_name: string | null; email: string | null } | null,
  cvAnalysis: CVAnalysis | null,
  discAnalysis: DISCAnalysis | null
): string {
  let prompt = `## Candidate Evaluation Request

**Candidate:** ${profile?.full_name || "Unknown"}
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
    prompt += `No CV analysis available. Evaluate skills based on business case responses.\n\n`;
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
    prompt += `No DISC assessment available. Evaluate personality and communication style based on business case responses.\n\n`;
  }

  // === BUSINESS CASE RESPONSES SECTION ===
  prompt += `### Business Case Responses\n\n`;

  if (responses.length === 0) {
    prompt += "No responses provided.\n\n";
  } else {
    responses.forEach((response) => {
      const bc = response.business_cases;
      prompt += `**Question ${bc?.question_number || "?"}: ${bc?.question_title || "Unknown"}**
${bc?.question_description || ""}

`;
      if (response.text_response) {
        prompt += `**Response:** ${response.text_response}\n\n`;
      } else if (response.video_url) {
        prompt += `**Response:** [Video response submitted - evaluate based on the fact they completed a video response]\n\n`;
      } else {
        prompt += `**Response:** [No response provided]\n\n`;
      }
    });
  }

  prompt += `
### Evaluation Instructions
Please analyze this candidate comprehensively using ALL available information and provide:
1. An overall compatibility score (0-100) - weighing CV experience, DISC fit, and response quality
2. A brief summary (2-3 sentences) that captures their experience level and personality
3. Key strengths (3-5 points) from across CV, DISC, and responses
4. Concerns or areas to probe in interview (1-3 points) including any red flags
5. Your recommendation (proceed/review/reject) based on the complete profile
6. Scores for: skills match (CV-weighted), communication quality (responses + DISC), and cultural fit (DISC + values alignment)

Be fair and constructive. Consider potential and growth mindset, not just current experience.
If CV or DISC analysis is missing, base your evaluation on the available information.`;

  return prompt;
}
