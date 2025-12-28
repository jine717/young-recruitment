import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentAnalysis {
  document_type: string;
  status: string;
  summary: string | null;
  analysis: Record<string, unknown> | null;
}

interface BCQResponse {
  id: string;
  business_case_id: string;
  transcription: string | null;
  content_quality_score: number | null;
  content_summary: string | null;
  content_strengths: string[] | null;
  content_areas_to_probe: string[] | null;
  fluency_overall_score: number | null;
  fluency_notes: string | null;
  business_case?: {
    question_number: number;
    question_title: string;
    question_description: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, customInstructions } = await req.json();
    console.log(`[analyze-post-bcq] Starting analysis for application: ${applicationId}`);

    if (!applicationId) {
      throw new Error("applicationId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application with job details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        jobs (
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
      console.error("[analyze-post-bcq] Application not found:", appError);
      throw new Error("Application not found");
    }

    // Fetch document analyses (CV and DISC)
    const { data: documentAnalyses } = await supabase
      .from("document_analyses")
      .select("*")
      .eq("application_id", applicationId);

    const cvAnalysis = documentAnalyses?.find((d: DocumentAnalysis) => d.document_type === "cv" && d.status === "completed");
    const discAnalysis = documentAnalyses?.find((d: DocumentAnalysis) => d.document_type === "disc" && d.status === "completed");

    // Fetch BCQ responses with business case questions
    const { data: bcqResponses } = await supabase
      .from("business_case_responses")
      .select(`
        *,
        business_case:business_cases (
          question_number,
          question_title,
          question_description
        )
      `)
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    // Fetch current AI evaluation
    const { data: currentEvaluation } = await supabase
      .from("ai_evaluations")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    // Build comprehensive prompt
    const job = application.jobs;
    let prompt = `You are an expert recruitment AI analyst. Re-evaluate this candidate considering ALL available information: their CV/resume, DISC personality assessment, AND their Business Case Question (BCQ) video responses.

## Job Position
- Title: ${job?.title || "Not specified"}
- Description: ${job?.description || "Not specified"}
- Requirements: ${job?.requirements?.join(", ") || "Not specified"}
- Responsibilities: ${job?.responsibilities?.join(", ") || "Not specified"}

## Candidate Information
- Name: ${application.candidate_name}
- Email: ${application.candidate_email}

`;

    // Add CV Analysis
    if (cvAnalysis?.analysis) {
      const cv = cvAnalysis.analysis as Record<string, unknown>;
      prompt += `## CV/Resume Analysis
- Summary: ${cvAnalysis.summary || "N/A"}
- Experience Years: ${cv.experience_years || "N/A"}
- Key Skills: ${Array.isArray(cv.key_skills) ? cv.key_skills.join(", ") : "N/A"}
- Education: ${typeof cv.education === 'string' ? cv.education : Array.isArray(cv.education) ? cv.education.map((e: any) => `${e.degree} at ${e.institution}`).join("; ") : "N/A"}
- Work History: ${typeof cv.work_history === 'string' ? cv.work_history : Array.isArray(cv.work_history) ? cv.work_history.map((w: any) => `${w.title} at ${w.company}`).join("; ") : "N/A"}
- Strengths: ${Array.isArray(cv.strengths) ? cv.strengths.join(", ") : "N/A"}
- Red Flags: ${Array.isArray(cv.red_flags) ? cv.red_flags.join(", ") : "N/A"}

`;
    } else {
      prompt += `## CV/Resume Analysis
No CV analysis available.

`;
    }

    // Add DISC Analysis
    if (discAnalysis?.analysis) {
      const disc = discAnalysis.analysis as Record<string, unknown>;
      prompt += `## DISC Personality Assessment
- Summary: ${discAnalysis.summary || "N/A"}
- Profile Type: ${disc.profile_type || "N/A"}
- Dominant Traits: ${Array.isArray(disc.dominant_traits) ? disc.dominant_traits.join(", ") : "N/A"}
- Communication Style: ${disc.communication_style || "N/A"}
- Work Style: ${disc.work_style || "N/A"}
- Team Fit: ${disc.team_fit || "N/A"}
- Management Tips: ${disc.management_tips || "N/A"}

`;
    } else {
      prompt += `## DISC Personality Assessment
No DISC analysis available.

`;
    }

    // Add BCQ Responses
    if (bcqResponses && bcqResponses.length > 0) {
      prompt += `## Business Case Question Responses
`;
      bcqResponses.forEach((response: BCQResponse) => {
        const bc = response.business_case;
        prompt += `
### Question ${bc?.question_number || "?"}: ${bc?.question_title || "Untitled"}
Description: ${bc?.question_description || "N/A"}

**Candidate's Response (Transcription):**
${response.transcription || "No transcription available"}

**Content Analysis:**
- Quality Score: ${response.content_quality_score || "N/A"}/100
- Summary: ${response.content_summary || "N/A"}
- Strengths: ${response.content_strengths?.join(", ") || "N/A"}
- Areas to Probe: ${response.content_areas_to_probe?.join(", ") || "N/A"}

**English Fluency:**
- Overall Fluency Score: ${response.fluency_overall_score || "N/A"}/100
- Notes: ${response.fluency_notes || "N/A"}

`;
      });
    } else {
      prompt += `## Business Case Question Responses
No BCQ responses available.

`;
    }

    // Add custom instructions if provided
    if (customInstructions) {
      prompt += `## Recruiter's Custom Instructions
${customInstructions}

`;
    }

    // Add job's AI system prompt if available
    if (job?.ai_system_prompt) {
      prompt += `## Job-Specific Evaluation Criteria
${job.ai_system_prompt}

`;
    }

    // Add previous score for context
    if (currentEvaluation) {
      prompt += `## Previous AI Evaluation (Initial - before BCQ)
- Overall Score: ${currentEvaluation.overall_score}/100
- Skills Match: ${currentEvaluation.skills_match_score}/100
- Communication: ${currentEvaluation.communication_score}/100
- Cultural Fit: ${currentEvaluation.cultural_fit_score}/100
- Recommendation: ${currentEvaluation.recommendation}
- Summary: ${currentEvaluation.summary || "N/A"}

`;
    }

    prompt += `## Instructions
Based on ALL the information above (CV, DISC, and BCQ responses), provide a comprehensive re-evaluation of this candidate. The BCQ responses are particularly important as they show the candidate's actual problem-solving approach, communication skills, and English fluency.

Provide your response in the following JSON format:
{
  "overall_score": <number 0-100>,
  "skills_match_score": <number 0-100>,
  "communication_score": <number 0-100>,
  "cultural_fit_score": <number 0-100>,
  "recommendation": "<proceed|review|reject>",
  "summary": "<2-3 sentence summary of the candidate>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "score_change_explanation": {
    "previous_score": <number or null>,
    "new_score": <number>,
    "change": <number>,
    "reasons_for_change": ["<reason 1>", "<reason 2>", ...]
  }
}

Be objective and thorough. Weight the BCQ responses heavily as they demonstrate real-world problem-solving ability.`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("[analyze-post-bcq] Calling Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[analyze-post-bcq] AI API error:", errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let evaluation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[analyze-post-bcq] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI evaluation");
    }

    console.log("[analyze-post-bcq] Parsed evaluation:", evaluation);

    // Update ai_evaluations table - preserve previous scores
    const updateData: Record<string, unknown> = {
      overall_score: evaluation.overall_score,
      skills_match_score: evaluation.skills_match_score,
      communication_score: evaluation.communication_score,
      cultural_fit_score: evaluation.cultural_fit_score,
      recommendation: evaluation.recommendation,
      summary: evaluation.summary,
      strengths: evaluation.strengths || [],
      concerns: evaluation.concerns || [],
      evaluation_stage: "post_bcq",
      raw_response: evaluation,
    };

    // Preserve pre-BCQ scores if this is the first post-BCQ analysis
    if (currentEvaluation && currentEvaluation.evaluation_stage !== "post_bcq") {
      updateData.pre_bcq_overall_score = currentEvaluation.overall_score;
      updateData.pre_bcq_skills_match_score = currentEvaluation.skills_match_score;
      updateData.pre_bcq_communication_score = currentEvaluation.communication_score;
      updateData.pre_bcq_cultural_fit_score = currentEvaluation.cultural_fit_score;
      updateData.pre_bcq_recommendation = currentEvaluation.recommendation;
    }

    if (currentEvaluation) {
      // Update existing evaluation
      const { error: updateError } = await supabase
        .from("ai_evaluations")
        .update(updateData)
        .eq("application_id", applicationId);

      if (updateError) {
        console.error("[analyze-post-bcq] Failed to update evaluation:", updateError);
        throw new Error("Failed to update AI evaluation");
      }
    } else {
      // Create new evaluation
      const { error: insertError } = await supabase
        .from("ai_evaluations")
        .insert({
          application_id: applicationId,
          ...updateData,
        });

      if (insertError) {
        console.error("[analyze-post-bcq] Failed to insert evaluation:", insertError);
        throw new Error("Failed to create AI evaluation");
      }
    }

    // Update application status to pre_interview and ai_score
    const { error: appUpdateError } = await supabase
      .from("applications")
      .update({
        status: "pre_interview",
        ai_score: evaluation.overall_score,
      })
      .eq("id", applicationId);

    if (appUpdateError) {
      console.error("[analyze-post-bcq] Failed to update application status:", appUpdateError);
      // Don't throw - evaluation was saved successfully
    }

    // Also save to document_analyses for persistence across stage changes
    const { error: docError } = await supabase
      .from("document_analyses")
      .upsert({
        application_id: applicationId,
        document_type: 'post_bcq_analysis',
        status: 'completed',
        summary: evaluation.summary,
        analysis: evaluation,
      }, {
        onConflict: 'application_id,document_type'
      });

    if (docError) {
      console.error("[analyze-post-bcq] Failed to save to document_analyses:", docError);
      // Don't throw - main evaluation was saved successfully
    }

    console.log("[analyze-post-bcq] Analysis completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        evaluation: {
          ...evaluation,
          previous_score: currentEvaluation?.overall_score || null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[analyze-post-bcq] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
