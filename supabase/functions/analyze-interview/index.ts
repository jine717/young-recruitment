import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewQuestion {
  id: string;
  question_text: string;
  category: string;
  reasoning: string | null;
  recruiter_note: string | null;
  priority: number;
}

interface FixedQuestion {
  id: string;
  question_text: string;
  category: string;
  priority: number;
}

interface FixedQuestionNote {
  fixed_question_id: string;
  note_text: string | null;
}

interface RecruiterNote {
  note_text: string;
  created_at: string;
}

interface PreviousAIScore {
  overall_score: number | null;
  skills_match_score: number | null;
  communication_score: number | null;
  cultural_fit_score: number | null;
  recommendation: string | null;
}

interface InterviewAnalysisResult {
  interview_summary: string;
  performance_assessment: string;
  strengths_demonstrated: string[];
  concerns_identified: string[];
  areas_needing_clarification: string[];
  new_overall_score: number;
  new_skills_score: number;
  new_communication_score: number;
  new_cultural_fit_score: number;
  new_recommendation: 'proceed' | 'review' | 'reject';
  score_change_explanation: {
    previous_score: number;
    new_score: number;
    change: number;
    reasons_for_change: string[];
  };
  next_steps_recommendation: string;
  suggested_follow_up_questions: string[];
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

    console.log("Starting interview analysis for application:", applicationId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, job_id, candidate_name")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      throw new Error(`Application not found: ${appError?.message}`);
    }

    // Fetch job details separately
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, requirements, responsibilities, description, ai_interview_prompt")
      .eq("id", application.job_id)
      .single();

    if (jobError) {
      console.warn("Could not fetch job details:", jobError.message);
    }

    console.log("Fetched application for job:", job?.title);

    // Fetch all interview-related data in parallel
    const [
      aiQuestionsResult,
      fixedQuestionsResult,
      fixedNotesResult,
      recruiterNotesResult,
      previousEvalResult
    ] = await Promise.all([
      supabase
        .from("interview_questions")
        .select("*")
        .eq("application_id", applicationId)
        .order("priority", { ascending: true }),
      supabase
        .from("job_fixed_questions")
        .select("*")
        .eq("job_id", application.job_id)
        .order("question_order", { ascending: true }),
      supabase
        .from("fixed_question_notes")
        .select("*")
        .eq("application_id", applicationId),
      supabase
        .from("recruiter_notes")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ai_evaluations")
        .select("overall_score, skills_match_score, communication_score, cultural_fit_score, recommendation")
        .eq("application_id", applicationId)
        .maybeSingle()
    ]);

    const aiQuestions: InterviewQuestion[] = aiQuestionsResult.data || [];
    const fixedQuestions: FixedQuestion[] = fixedQuestionsResult.data || [];
    const fixedNotes: FixedQuestionNote[] = fixedNotesResult.data || [];
    const recruiterNotes: RecruiterNote[] = recruiterNotesResult.data || [];
    const previousEval: PreviousAIScore | null = previousEvalResult.data;

    console.log(`Found: ${aiQuestions.length} AI questions, ${fixedQuestions.length} fixed questions, ${recruiterNotes.length} notes`);

    // Build the analysis prompt
    const prompt = buildInterviewAnalysisPrompt({
      candidateName: application.candidate_name || "Unknown Candidate",
      jobTitle: job?.title || "Unknown Position",
      jobRequirements: job?.requirements || [],
      jobResponsibilities: job?.responsibilities || [],
      jobDescription: job?.description || "",
      aiQuestions,
      fixedQuestions,
      fixedNotes,
      recruiterNotes,
      previousEval
    });

    // Call Lovable AI for interview analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert HR analyst specializing in interview evaluation. Analyze interview data and provide structured assessments. Be objective, insightful, and provide actionable feedback.`
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_interview_analysis",
              description: "Provide a comprehensive interview analysis with updated AI Score",
              parameters: {
                type: "object",
                properties: {
                  interview_summary: { 
                    type: "string", 
                    description: "2-3 sentence summary of the interview performance" 
                  },
                  performance_assessment: { 
                    type: "string", 
                    description: "Detailed assessment of how the candidate performed" 
                  },
                  strengths_demonstrated: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Key strengths shown during the interview (3-5 items)"
                  },
                  concerns_identified: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Concerns or red flags from the interview (0-4 items)"
                  },
                  areas_needing_clarification: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Areas that need follow-up or clarification (0-3 items)"
                  },
                  new_overall_score: { 
                    type: "number", 
                    description: "Updated overall score 0-100 based on all data including interview" 
                  },
                  new_skills_score: { 
                    type: "number", 
                    description: "Updated skills match score 0-100" 
                  },
                  new_communication_score: { 
                    type: "number", 
                    description: "Updated communication score 0-100" 
                  },
                  new_cultural_fit_score: { 
                    type: "number", 
                    description: "Updated cultural fit score 0-100" 
                  },
                  new_recommendation: { 
                    type: "string", 
                    enum: ["proceed", "review", "reject"],
                    description: "Updated recommendation based on interview"
                  },
                  reasons_for_score_change: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Specific reasons why the score increased or decreased (2-4 items)"
                  },
                  next_steps_recommendation: { 
                    type: "string", 
                    description: "Recommended next steps for this candidate"
                  },
                  suggested_follow_up_questions: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Questions for potential follow-up interview (2-4 items)"
                  }
                },
                required: [
                  "interview_summary",
                  "performance_assessment", 
                  "strengths_demonstrated",
                  "concerns_identified",
                  "new_overall_score",
                  "new_skills_score",
                  "new_communication_score",
                  "new_cultural_fit_score",
                  "new_recommendation",
                  "reasons_for_score_change",
                  "next_steps_recommendation"
                ],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_interview_analysis" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_interview_analysis") {
      throw new Error("Invalid AI response format");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log("Parsed analysis:", analysisResult);

    // Build the final analysis object
    const previousScore = previousEval?.overall_score || 50;
    const newScore = analysisResult.new_overall_score;
    const scoreChange = newScore - previousScore;

    const interviewAnalysis: InterviewAnalysisResult = {
      interview_summary: analysisResult.interview_summary,
      performance_assessment: analysisResult.performance_assessment,
      strengths_demonstrated: analysisResult.strengths_demonstrated || [],
      concerns_identified: analysisResult.concerns_identified || [],
      areas_needing_clarification: analysisResult.areas_needing_clarification || [],
      new_overall_score: newScore,
      new_skills_score: analysisResult.new_skills_score,
      new_communication_score: analysisResult.new_communication_score,
      new_cultural_fit_score: analysisResult.new_cultural_fit_score,
      new_recommendation: analysisResult.new_recommendation,
      score_change_explanation: {
        previous_score: previousScore,
        new_score: newScore,
        change: scoreChange,
        reasons_for_change: analysisResult.reasons_for_score_change || []
      },
      next_steps_recommendation: analysisResult.next_steps_recommendation,
      suggested_follow_up_questions: analysisResult.suggested_follow_up_questions || []
    };

    // Check if interview analysis already exists
    const { data: existingAnalysis } = await supabase
      .from("document_analyses")
      .select("id")
      .eq("application_id", applicationId)
      .eq("document_type", "interview")
      .maybeSingle();

    // Save or update interview analysis in document_analyses
    if (existingAnalysis) {
      await supabase
        .from("document_analyses")
        .update({
          analysis: interviewAnalysis,
          summary: interviewAnalysis.interview_summary,
          status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingAnalysis.id);
    } else {
      await supabase
        .from("document_analyses")
        .insert({
          application_id: applicationId,
          document_type: "interview",
          analysis: interviewAnalysis,
          summary: interviewAnalysis.interview_summary,
          status: "completed"
        });
    }

    console.log("Interview analysis saved to document_analyses");

    // Update AI evaluation with new scores
    const { data: existingEval } = await supabase
      .from("ai_evaluations")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existingEval) {
      await supabase
        .from("ai_evaluations")
        .update({
          overall_score: newScore,
          skills_match_score: analysisResult.new_skills_score,
          communication_score: analysisResult.new_communication_score,
          cultural_fit_score: analysisResult.new_cultural_fit_score,
          recommendation: analysisResult.new_recommendation
        })
        .eq("id", existingEval.id);
    }

    // Update application ai_score
    await supabase
      .from("applications")
      .update({ ai_score: newScore })
      .eq("id", applicationId);

    console.log("AI scores updated successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: interviewAnalysis 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Interview analysis error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildInterviewAnalysisPrompt(params: {
  candidateName: string;
  jobTitle: string;
  jobRequirements: string[];
  jobResponsibilities: string[];
  jobDescription: string;
  aiQuestions: InterviewQuestion[];
  fixedQuestions: FixedQuestion[];
  fixedNotes: FixedQuestionNote[];
  recruiterNotes: RecruiterNote[];
  previousEval: PreviousAIScore | null;
}): string {
  const {
    candidateName,
    jobTitle,
    jobRequirements,
    jobResponsibilities,
    jobDescription,
    aiQuestions,
    fixedQuestions,
    fixedNotes,
    recruiterNotes,
    previousEval
  } = params;

  // Build fixed questions with their notes
  const fixedQuestionsWithNotes = fixedQuestions.map(q => {
    const note = fixedNotes.find(n => n.fixed_question_id === q.id);
    return {
      question: q.question_text,
      category: q.category,
      recruiterNote: note?.note_text || null
    };
  });

  // Build AI questions section
  let aiQuestionsSection = "No AI-generated questions available";
  if (aiQuestions.length > 0) {
    aiQuestionsSection = aiQuestions.map((q, i) => {
      const reasoning = q.reasoning ? `\n**AI Reasoning**: ${q.reasoning}` : "";
      const note = q.recruiter_note 
        ? `\n**Recruiter Observation**: ${q.recruiter_note}` 
        : "\n**Recruiter Observation**: No notes recorded";
      return `### Question ${i + 1} (${q.category})\n**Question**: ${q.question_text}${reasoning}${note}`;
    }).join("\n\n");
  }

  // Build fixed questions section
  let fixedQuestionsSection = "No fixed questions for this position";
  if (fixedQuestionsWithNotes.length > 0) {
    fixedQuestionsSection = fixedQuestionsWithNotes.map((q, i) => {
      const note = q.recruiterNote 
        ? `\n**Recruiter Observation**: ${q.recruiterNote}` 
        : "\n**Recruiter Observation**: No notes recorded";
      return `### Fixed Question ${i + 1} (${q.category})\n**Question**: ${q.question}${note}`;
    }).join("\n\n");
  }

  // Build general notes section
  const notesSection = recruiterNotes.length > 0 
    ? recruiterNotes.map(n => `- ${n.note_text}`).join("\n") 
    : "No general interview notes recorded";

  // Build previous eval section
  let previousEvalSection = "No previous evaluation available (assume baseline of 50)";
  if (previousEval) {
    previousEvalSection = `- Overall Score: ${previousEval.overall_score ?? "N/A"}/100
- Skills Match: ${previousEval.skills_match_score ?? "N/A"}/100
- Communication: ${previousEval.communication_score ?? "N/A"}/100
- Cultural Fit: ${previousEval.cultural_fit_score ?? "N/A"}/100
- Recommendation: ${previousEval.recommendation ?? "N/A"}`;
  }

  const prompt = `
# Interview Analysis Request

## Candidate Information
- **Name**: ${candidateName}
- **Position**: ${jobTitle}

## Job Requirements
${jobRequirements.length > 0 ? jobRequirements.map(r => `- ${r}`).join('\n') : 'No specific requirements listed'}

## Job Responsibilities
${jobResponsibilities.length > 0 ? jobResponsibilities.map(r => `- ${r}`).join('\n') : 'No specific responsibilities listed'}

## Job Description
${jobDescription || 'No description available'}

## Previous AI Score (Pre-Interview)
${previousEvalSection}

## AI-Generated Interview Questions & Recruiter Notes
${aiQuestionsSection}

## Fixed Interview Questions & Recruiter Notes
${fixedQuestionsSection}

## General Interview Notes
${notesSection}

---

## Analysis Instructions

Based on ALL the information above, provide a comprehensive interview analysis:

1. **Interview Summary**: Summarize how the interview went overall
2. **Performance Assessment**: Evaluate the candidate's interview performance in detail
3. **Strengths Demonstrated**: What strengths did the candidate show during the interview?
4. **Concerns Identified**: What concerns or red flags emerged?
5. **Updated AI Scores**: Based on the interview data, update all scores (0-100). Consider:
   - If recruiter notes are positive, scores should generally increase
   - If recruiter notes reveal concerns, scores should decrease
   - If limited notes exist, maintain similar scores with slight adjustment
6. **Score Change Explanation**: Clearly explain WHY the score changed (or didn't change)
7. **Next Steps**: Recommend what should happen next with this candidate

IMPORTANT: 
- Be objective and base your analysis on the actual data provided
- If no notes were recorded for questions, assume the interview was standard/neutral
- The score change should be proportional to the interview evidence
`;

  return prompt;
}
