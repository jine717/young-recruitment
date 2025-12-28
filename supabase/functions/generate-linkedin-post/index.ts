import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateLinkedInPostRequest {
  jobId: string;
  regenerate?: boolean;
  customInstructions?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, regenerate = false, customInstructions } = await req.json() as GenerateLinkedInPostRequest;

    if (!jobId) {
      return new Response(
        JSON.stringify({ success: false, error: "Job ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating LinkedIn post for job: ${jobId}, regenerate: ${regenerate}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job details with department
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        description,
        location,
        type,
        responsibilities,
        requirements,
        benefits,
        tags,
        linkedin_post_content,
        linkedin_post_status,
        departments:department_id (name)
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Job not found:", jobError);
      return new Response(
        JSON.stringify({ success: false, error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for cached content (skip if regenerate is true)
    if (!regenerate && job.linkedin_post_content) {
      console.log("Returning cached LinkedIn post content");
      return new Response(
        JSON.stringify({
          success: true,
          content: job.linkedin_post_content,
          characterCount: job.linkedin_post_content.length,
          hashtags: extractHashtags(job.linkedin_post_content),
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build AI prompt
    const deptData = job.departments as { name: string } | { name: string }[] | null;
    const departmentName = Array.isArray(deptData) ? deptData[0]?.name : deptData?.name || "Our team";
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(job, departmentName, customInstructions);

    console.log("Calling Lovable AI Gateway for content generation...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_linkedin_post",
              description: "Create a structured LinkedIn job posting with hook, body, call-to-action, and hashtags",
              parameters: {
                type: "object",
                properties: {
                  hook: {
                    type: "string",
                    description: "Attention-grabbing opening line (1-2 sentences, max 150 chars)",
                  },
                  body: {
                    type: "string",
                    description: "Main content describing the role and opportunity (max 2000 chars)",
                  },
                  call_to_action: {
                    type: "string",
                    description: "Clear CTA encouraging applications (max 200 chars)",
                  },
                  hashtags: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 relevant hashtags without the # symbol",
                  },
                },
                required: ["hook", "body", "call_to_action", "hashtags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_linkedin_post" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("AI credits exhausted");
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received:", JSON.stringify(aiResponse).substring(0, 200));

    // Extract tool call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "create_linkedin_post") {
      console.error("Invalid AI response format:", aiResponse);
      throw new Error("Failed to generate LinkedIn post content");
    }

    const postData = JSON.parse(toolCall.function.arguments);
    
    // Combine content parts
    const hashtags = postData.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`);
    const fullContent = `${postData.hook}\n\n${postData.body}\n\n${postData.call_to_action}\n\n${hashtags.join(" ")}`;

    // Validate character count
    if (fullContent.length > 3000) {
      console.warn(`Content exceeds 3000 chars (${fullContent.length}), truncating...`);
      // Truncate body if needed
      const maxBodyLength = 2000 - (fullContent.length - 3000);
      const truncatedBody = postData.body.substring(0, maxBodyLength) + "...";
      const truncatedContent = `${postData.hook}\n\n${truncatedBody}\n\n${postData.call_to_action}\n\n${hashtags.join(" ")}`;
      postData.body = truncatedBody;
    }

    const finalContent = `${postData.hook}\n\n${postData.body}\n\n${postData.call_to_action}\n\n${hashtags.join(" ")}`;

    // Save to database
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        linkedin_post_content: finalContent,
        linkedin_post_status: "draft",
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Failed to save LinkedIn content:", updateError);
      // Still return the content even if save fails
    }

    console.log(`LinkedIn post generated successfully. Character count: ${finalContent.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        content: finalContent,
        characterCount: finalContent.length,
        hashtags: postData.hashtags,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating LinkedIn post:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate LinkedIn post" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(): string {
  return `You are a professional LinkedIn content creator for YOUNG, a bold and disruptive recruitment company. 

BRAND VOICE:
- Fearless, Unusual, Down to earth
- Agility, Determination, Authenticity
- Tagline: "Unite to Disrupt"

CONTENT GUIDELINES:
- Write engaging, professional LinkedIn posts that attract top talent
- Use a confident but approachable tone
- Highlight what makes this opportunity unique
- Keep total content under 2800 characters (LinkedIn limit is 3000)
- Use line breaks for readability
- Include relevant emojis sparingly (2-4 max)
- Create FOMO and excitement without being pushy

STRUCTURE:
1. Hook: Attention-grabbing opening that stops the scroll
2. Body: Key responsibilities, requirements, and what makes this role special
3. CTA: Clear call-to-action with application instructions
4. Hashtags: 3-5 relevant industry hashtags`;
}

function buildUserPrompt(job: any, departmentName: string, customInstructions?: string): string {
  const responsibilities = job.responsibilities?.join("\n• ") || "";
  const requirements = job.requirements?.join("\n• ") || "";
  const benefits = job.benefits?.join("\n• ") || "";
  const tags = job.tags?.join(", ") || "";

  let prompt = `Create a LinkedIn job posting for the following position:

**Position:** ${job.title}
**Department:** ${departmentName}
**Location:** ${job.location}
**Type:** ${job.type}

**Description:**
${job.description}

**Key Responsibilities:**
• ${responsibilities}

**Requirements:**
• ${requirements}

**Benefits:**
• ${benefits}

**Tags/Keywords:** ${tags}

Generate an engaging LinkedIn post that will attract qualified candidates and showcase YOUNG's unique culture.`;

  if (customInstructions) {
    prompt += `\n\n**Additional Instructions:**\n${customInstructions}`;
  }

  return prompt;
}

function extractHashtags(content: string): string[] {
  const matches = content.match(/#\w+/g) || [];
  return matches.map(h => h.replace("#", ""));
}
