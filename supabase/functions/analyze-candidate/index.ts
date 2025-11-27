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
          responsibilities
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
      .single();

    // Build the analysis prompt
    const job = application.jobs;
    const prompt = buildAnalysisPrompt(job, responses || [], profile);

    console.log("Calling Lovable AI for analysis...");

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
            content: `You are an expert recruitment analyst for a modern, disruptive company called Young. 
Your task is to analyze candidate responses and provide a structured evaluation.
Be fair but thorough. Look for potential, communication skills, and cultural fit.
The company values: Fearless, Unusual, Down to earth, Agility, Determination, and Authenticity.`,
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
                    description: "Overall compatibility score from 0-100",
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence summary of the candidate",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key strengths identified",
                  },
                  concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 concerns or areas to probe",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["proceed", "review", "reject"],
                    description: "Recommendation for next steps",
                  },
                  skills_match_score: {
                    type: "number",
                    description: "How well skills match requirements (0-100)",
                  },
                  communication_score: {
                    type: "number",
                    description: "Quality of communication in responses (0-100)",
                  },
                  cultural_fit_score: {
                    type: "number",
                    description: "Alignment with company values (0-100)",
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
  job: { title: string; description: string; requirements: string[] | null; responsibilities: string[] | null } | null,
  responses: Array<{
    text_response: string | null;
    video_url: string | null;
    business_cases: { question_title: string; question_description: string; question_number: number } | null;
  }>,
  profile: { full_name: string | null; email: string | null } | null
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

### Candidate's Business Case Responses

`;

  if (responses.length === 0) {
    prompt += "No responses provided.\n";
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
Please analyze this candidate thoroughly and provide:
1. An overall compatibility score (0-100)
2. A brief summary (2-3 sentences)
3. Key strengths (3-5 points)
4. Concerns or areas to probe in interview (1-3 points)
5. Your recommendation (proceed/review/reject)
6. Scores for: skills match, communication quality, and cultural fit

Be fair and constructive. Consider potential and growth mindset, not just current experience.`;

  return prompt;
}
