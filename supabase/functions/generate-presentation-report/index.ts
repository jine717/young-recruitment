import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandidateRanking {
  rank: number;
  candidate_name: string;
  application_id: string;
  score: number;
  key_differentiator: string;
}

interface ComparisonMatrixItem {
  criterion: string;
  candidates: {
    application_id: string;
    score: number;
    notes: string;
  }[];
}

interface ComparisonRecommendation {
  top_choice: string;
  application_id: string;
  confidence: 'high' | 'medium' | 'low';
  justification: string;
  alternative?: string;
  alternative_justification?: string;
}

interface CandidateRisk {
  candidate_name: string;
  application_id: string;
  risks: string[];
}

interface ComparisonResult {
  executive_summary: string;
  rankings: CandidateRanking[];
  comparison_matrix: ComparisonMatrixItem[];
  recommendation: ComparisonRecommendation;
  risks: CandidateRisk[];
}

interface PresentationContent {
  executive_narrative: string;
  winner_spotlight: {
    name: string;
    score: number;
    headline: string;
    key_strengths: string[];
    why_chosen: string;
  };
  candidate_summary: {
    viable_count: number;
    total_count: number;
    non_viable_message: string;
  };
  key_insights: string[];
  considerations: string[];
  next_steps: {
    actions: string[];
    timeline: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comparisonResult, jobTitle } = await req.json() as {
      comparisonResult: ComparisonResult;
      jobTitle: string;
    };

    if (!comparisonResult || !jobTitle) {
      throw new Error('Missing required parameters: comparisonResult and jobTitle');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Filter viable candidates (score > 0)
    const viableCandidates = comparisonResult.rankings.filter(c => c.score > 0);
    const nonViableCount = comparisonResult.rankings.length - viableCandidates.length;

    // Get top candidate
    const topCandidate = viableCandidates[0];
    
    // Get risks for top candidate
    const topCandidateRisks = comparisonResult.risks.find(
      r => r.candidate_name === topCandidate?.candidate_name
    )?.risks || [];

    const systemPrompt = `You are an executive recruitment consultant creating a presentation-quality report for stakeholders. Your writing style is:
- Professional and confident
- Action-oriented
- Concise but impactful
- Positive framing (opportunities, not problems)

CRITICAL RULES:
1. NEVER mention candidates with score 0 or "None" as alternatives
2. Use full candidate names, never truncate
3. Frame "risks" as "areas to explore" or "considerations"
4. Write for C-level executives who need quick decisions
5. Maximum 3-4 sentences per section
6. Use active voice and strong verbs`;

    const userPrompt = `Generate executive presentation content for this candidate comparison report.

POSITION: ${jobTitle}

TOP RECOMMENDED CANDIDATE:
- Name: ${topCandidate?.candidate_name || 'No viable candidate'}
- Score: ${topCandidate?.score || 0}/100
- Key Differentiator: ${topCandidate?.key_differentiator || 'N/A'}

ORIGINAL AI SUMMARY:
${comparisonResult.executive_summary}

ORIGINAL RECOMMENDATION:
${comparisonResult.recommendation.justification}

CONFIDENCE LEVEL: ${comparisonResult.recommendation.confidence}

VIABLE CANDIDATES (${viableCandidates.length} of ${comparisonResult.rankings.length}):
${viableCandidates.map(c => `- ${c.candidate_name}: ${c.score}/100 - ${c.key_differentiator}`).join('\n')}

AREAS TO EXPLORE FOR TOP CANDIDATE:
${topCandidateRisks.length > 0 ? topCandidateRisks.join('\n') : 'No specific concerns identified'}

Generate the presentation content following the exact structure specified in the tool.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_presentation_content',
              description: 'Generate structured content for an executive presentation report',
              parameters: {
                type: 'object',
                properties: {
                  executive_narrative: {
                    type: 'string',
                    description: '3-4 sentences providing executive summary narrative. Professional tone, highlight the key recommendation and confidence level.'
                  },
                  winner_spotlight: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Full name of the recommended candidate' },
                      score: { type: 'number', description: 'Score out of 100' },
                      headline: { type: 'string', description: 'One impactful sentence about why this candidate stands out (max 15 words)' },
                      key_strengths: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Exactly 3 key strengths as short bullet points (max 8 words each)'
                      },
                      why_chosen: { type: 'string', description: '2-3 sentences explaining the recommendation rationale' }
                    },
                    required: ['name', 'score', 'headline', 'key_strengths', 'why_chosen']
                  },
                  key_insights: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Exactly 3 key insights about the candidate pool and hiring situation (max 12 words each)'
                  },
                  considerations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '2-3 areas to explore in final interview, framed positively (max 10 words each)'
                  },
                  next_steps: {
                    type: 'object',
                    properties: {
                      actions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Exactly 3 recommended next actions (max 8 words each)'
                      },
                      timeline: {
                        type: 'string',
                        description: 'Recommended timeline to complete hiring (e.g., "5-7 business days")'
                      }
                    },
                    required: ['actions', 'timeline']
                  }
                },
                required: ['executive_narrative', 'winner_spotlight', 'key_insights', 'considerations', 'next_steps']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_presentation_content' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response:', JSON.stringify(aiResponse, null, 2));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_presentation_content') {
      throw new Error('Invalid AI response structure');
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    // Build the final presentation content with candidate summary
    const presentationContent: PresentationContent = {
      ...generatedContent,
      candidate_summary: {
        viable_count: viableCandidates.length,
        total_count: comparisonResult.rankings.length,
        non_viable_message: nonViableCount > 0 
          ? `${nonViableCount} candidate${nonViableCount > 1 ? 's' : ''} did not provide sufficient responses for evaluation`
          : ''
      }
    };

    // Add viable candidates data for the chart
    const responseData = {
      success: true,
      presentationContent,
      viableCandidates: viableCandidates.map(c => ({
        name: c.candidate_name,
        score: c.score
      })),
      confidence: comparisonResult.recommendation.confidence
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating presentation report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
