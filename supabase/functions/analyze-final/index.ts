import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, customInstructions } = await req.json();
    console.log(`[analyze-final] Starting final evaluation for application: ${applicationId}`);

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
      console.error("[analyze-final] Application not found:", appError);
      throw new Error("Application not found");
    }

    // Fetch AI evaluation with all scores
    const { data: aiEvaluation } = await supabase
      .from("ai_evaluations")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    // Fetch all document analyses
    const { data: documentAnalyses } = await supabase
      .from("document_analyses")
      .select("*")
      .eq("application_id", applicationId);

    const cvAnalysis = documentAnalyses?.find(d => d.document_type === "cv" && d.status === "completed");
    const discAnalysis = documentAnalyses?.find(d => d.document_type === "disc" && d.status === "completed");
    const interviewAnalysis = documentAnalyses?.find(d => d.document_type === "interview" && d.status === "completed");
    const postBcqAnalysis = documentAnalyses?.find(d => d.document_type === "post_bcq_analysis" && d.status === "completed");

    // Fetch BCQ responses
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
      .eq("application_id", applicationId);

    // Fetch recruiter notes
    const { data: recruiterNotes } = await supabase
      .from("recruiter_notes")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    // Fetch interview evaluations
    const { data: interviewEvaluations } = await supabase
      .from("interview_evaluations")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    // Build comprehensive prompt
    const job = application.jobs;
    let prompt = `You are an expert recruitment AI analyst conducting a FINAL comprehensive evaluation of a candidate. This is the ultimate assessment that will inform the hiring decision, combining ALL stages of the hiring process.

## Job Position
- Title: ${job?.title || "Not specified"}
- Description: ${job?.description || "Not specified"}
- Requirements: ${job?.requirements?.join(", ") || "Not specified"}
- Responsibilities: ${job?.responsibilities?.join(", ") || "Not specified"}

## Candidate Information
- Name: ${application.candidate_name}
- Email: ${application.candidate_email}

`;

    // Add score progression
    prompt += `## Score Progression Through Stages
- Initial Score (CV + DISC): ${aiEvaluation?.initial_overall_score ?? "N/A"}/100
- Post-BCQ Score: ${aiEvaluation?.pre_bcq_overall_score ?? "N/A"}/100
- Current Score (Post-Interview): ${aiEvaluation?.overall_score ?? "N/A"}/100

`;

    // Add CV Analysis
    if (cvAnalysis?.analysis) {
      const cv = cvAnalysis.analysis as Record<string, unknown>;
      prompt += `## CV/Resume Analysis
- Summary: ${cvAnalysis.summary || "N/A"}
- Experience Years: ${cv.experience_years || "N/A"}
- Key Skills: ${Array.isArray(cv.key_skills) ? cv.key_skills.join(", ") : "N/A"}
- Strengths: ${Array.isArray(cv.strengths) ? cv.strengths.join(", ") : "N/A"}
- Red Flags: ${Array.isArray(cv.red_flags) ? cv.red_flags.join(", ") : "N/A"}

`;
    }

    // Add DISC Analysis
    if (discAnalysis?.analysis) {
      const disc = discAnalysis.analysis as Record<string, unknown>;
      prompt += `## DISC Personality Assessment
- Profile Type: ${disc.profile_type || "N/A"}
- Dominant Traits: ${Array.isArray(disc.dominant_traits) ? disc.dominant_traits.join(", ") : "N/A"}
- Communication Style: ${disc.communication_style || "N/A"}
- Work Style: ${disc.work_style || "N/A"}
- Team Fit: ${disc.team_fit || "N/A"}

`;
    }

    // Add Post-BCQ Analysis summary
    if (postBcqAnalysis?.analysis) {
      const bcq = postBcqAnalysis.analysis as Record<string, unknown>;
      prompt += `## BCQ Assessment Summary
- BCQ Score: ${bcq.overall_score || "N/A"}/100
- Summary: ${bcq.summary || postBcqAnalysis.summary || "N/A"}
- Recommendation: ${bcq.recommendation || "N/A"}
- Strengths: ${Array.isArray(bcq.strengths) ? bcq.strengths.join(", ") : "N/A"}
- Concerns: ${Array.isArray(bcq.concerns) ? bcq.concerns.join(", ") : "N/A"}

`;
    }

    // Add BCQ Responses detail
    if (bcqResponses && bcqResponses.length > 0) {
      prompt += `## BCQ Response Details
`;
      bcqResponses.forEach((response: any) => {
        const bc = response.business_case;
        prompt += `
### Question ${bc?.question_number || "?"}: ${bc?.question_title || "Untitled"}
- Content Quality Score: ${response.content_quality_score || "N/A"}/100
- Fluency Score: ${response.fluency_overall_score || "N/A"}/100
- Summary: ${response.content_summary || "N/A"}
`;
      });
      prompt += "\n";
    }

    // Add Interview Analysis
    if (interviewAnalysis?.analysis) {
      const interview = interviewAnalysis.analysis as Record<string, unknown>;
      prompt += `## Interview Analysis
- Summary: ${interviewAnalysis.summary || interview.summary || "N/A"}
- Performance Assessment: ${interview.performance_assessment || "N/A"}
- Strengths Identified: ${Array.isArray(interview.strengths_identified) ? interview.strengths_identified.join(", ") : "N/A"}
- Concerns Identified: ${Array.isArray(interview.concerns_identified) ? interview.concerns_identified.join(", ") : "N/A"}
- Score Change Explanation: ${interview.score_change_explanation || "N/A"}

`;
    }

    // Add Interview Evaluations (manual)
    if (interviewEvaluations && interviewEvaluations.length > 0) {
      const latestEval = interviewEvaluations[0];
      prompt += `## Manual Interview Evaluation
- Technical Score: ${latestEval.technical_score || "N/A"}/100
- Communication Score: ${latestEval.communication_score || "N/A"}/100
- Cultural Fit Score: ${latestEval.cultural_fit_score || "N/A"}/100
- Problem Solving Score: ${latestEval.problem_solving_score || "N/A"}/100
- Overall Impression: ${latestEval.overall_impression || "N/A"}
- Recommendation: ${latestEval.recommendation || "N/A"}
- Strengths: ${latestEval.strengths?.join(", ") || "N/A"}
- Areas for Improvement: ${latestEval.areas_for_improvement?.join(", ") || "N/A"}

`;
    }

    // Add Recruiter Notes
    if (recruiterNotes && recruiterNotes.length > 0) {
      prompt += `## Recruiter Notes
`;
      recruiterNotes.slice(0, 5).forEach((note: any, index: number) => {
        prompt += `${index + 1}. ${note.note_text}
`;
      });
      prompt += "\n";
    }

    // Add custom instructions
    if (customInstructions) {
      prompt += `## Recruiter's Custom Instructions
${customInstructions}

`;
    }

    // Add job's AI system prompt
    if (job?.ai_system_prompt) {
      prompt += `## Job-Specific Evaluation Criteria
${job.ai_system_prompt}

`;
    }

    prompt += `## Instructions
Based on ALL the information above from EVERY stage of the hiring process, provide a comprehensive FINAL evaluation. This evaluation will be used to make the ultimate hiring decision.

Provide your response in the following JSON format:
{
  "final_overall_score": <number 0-100>,
  "final_recommendation": "<hire|proceed_with_caution|reject>",
  "technical_competency": <number 0-100>,
  "communication_skills": <number 0-100>,
  "cultural_fit": <number 0-100>,
  "problem_solving": <number 0-100>,
  "leadership_potential": <number 0-100>,
  "executive_summary": "<3-4 sentence executive summary>",
  "strengths_summary": ["<key strength 1>", "<key strength 2>", ...],
  "concerns_summary": ["<concern 1>", "<concern 2>", ...],
  "stage_progression": {
    "initial_score": <number or null>,
    "post_bcq_score": <number or null>,
    "interview_score": <number or null>,
    "final_score": <number>,
    "trend": "<improving|stable|declining>"
  },
  "hiring_recommendation": "<detailed hiring recommendation paragraph>",
  "compensation_considerations": "<thoughts on appropriate compensation level>",
  "onboarding_suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "risk_assessment": "<assessment of hiring risks>"
}

Be thorough, objective, and provide actionable insights. This is the final word on this candidate.`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("[analyze-final] Calling Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert recruitment analyst. Respond only with valid JSON, no markdown formatting or code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[analyze-final] AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No response from AI");
    }

    console.log("[analyze-final] Raw AI response:", aiContent.substring(0, 500));

    // Parse JSON from response
    let evaluation;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      evaluation = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("[analyze-final] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI evaluation response");
    }

    // Save to document_analyses
    const { error: saveError } = await supabase
      .from("document_analyses")
      .upsert({
        application_id: applicationId,
        document_type: "final_evaluation",
        status: "completed",
        summary: evaluation.executive_summary,
        analysis: evaluation,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "application_id,document_type",
      });

    if (saveError) {
      console.error("[analyze-final] Failed to save evaluation:", saveError);
      throw new Error("Failed to save final evaluation");
    }

    // Update ai_evaluations with final stage
    const { error: updateError } = await supabase
      .from("ai_evaluations")
      .update({
        evaluation_stage: "final",
        overall_score: evaluation.final_overall_score,
        skills_match_score: evaluation.technical_competency,
        communication_score: evaluation.communication_skills,
        cultural_fit_score: evaluation.cultural_fit,
        recommendation: evaluation.final_recommendation === "hire" ? "proceed" : 
                        evaluation.final_recommendation === "reject" ? "reject" : "review",
        summary: evaluation.executive_summary,
        strengths: evaluation.strengths_summary,
        concerns: evaluation.concerns_summary,
      })
      .eq("application_id", applicationId);

    if (updateError) {
      console.error("[analyze-final] Failed to update ai_evaluations:", updateError);
      // Don't throw - document_analyses was saved successfully
    }

    // Auto-update application status to 'evaluated'
    const { error: statusError } = await supabase
      .from("applications")
      .update({
        status: "evaluated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (statusError) {
      console.error("[analyze-final] Failed to update status to evaluated:", statusError);
    } else {
      console.log("[analyze-final] Application status updated to 'evaluated'");
    }

    console.log("[analyze-final] Final evaluation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        evaluation,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[analyze-final] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
