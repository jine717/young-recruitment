import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CandidateRanking {
  name: string;
  score: number;
  recommendation: string;
}

interface TopRecommendation {
  name: string;
  score: number;
  keyStrengths: string[];
  whyChosen: string;
}

interface ExecutiveReportRequest {
  recipientEmail: string;
  personalMessage?: string;
  jobTitle: string;
  executiveSummary: string;
  topRecommendation: TopRecommendation;
  rankings: CandidateRanking[];
  keyInsights: string[];
  confidence: 'high' | 'medium' | 'low';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      personalMessage,
      jobTitle,
      executiveSummary,
      topRecommendation,
      rankings,
      keyInsights,
      confidence,
    }: ExecutiveReportRequest = await req.json();

    console.log("Sending executive report to:", recipientEmail);
    console.log("Job title:", jobTitle);

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const confidenceColor = confidence === 'high' ? '#22C55E' : confidence === 'medium' ? '#F97316' : '#EF4444';

    const rankingsHtml = rankings
      .map((candidate, index) => {
        const barWidth = Math.round(candidate.score);
        const isWinner = index === 0;
        const barColor = isWinner ? '#B88F5E' : '#605738';
        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 600; color: ${isWinner ? '#B88F5E' : '#100D0A'}; min-width: 24px;">
                  ${index + 1}.
                </span>
                <span style="flex: 1; color: #100D0A;">${candidate.name}</span>
                <div style="width: 200px; background: #E5E5E5; border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="width: ${barWidth}%; background: ${barColor}; height: 100%; border-radius: 4px;"></div>
                </div>
                <span style="font-weight: 600; color: #100D0A; min-width: 40px; text-align: right;">${candidate.score}</span>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    const strengthsHtml = topRecommendation.keyStrengths
      .map((strength) => `<li style="margin-bottom: 8px; color: #100D0A;">${strength}</li>`)
      .join('');

    const insightsHtml = keyInsights
      .map((insight) => `<li style="margin-bottom: 8px; color: #100D0A;">${insight}</li>`)
      .join('');

    const personalMessageHtml = personalMessage
      ? `
        <div style="background: #F5F5F5; border-left: 4px solid #93B1FF; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #605738; font-style: italic;">"${personalMessage}"</p>
        </div>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Executive Report - ${jobTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #FDFAF0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFAF0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #93B1FF 0%, #7a9ce8 100%); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #100D0A; font-size: 28px; font-weight: 800; letter-spacing: 2px;">YOUNG.</h1>
                    <p style="margin: 8px 0 0 0; color: #100D0A; font-size: 14px; opacity: 0.8;">Executive Candidate Report</p>
                  </td>
                </tr>

                <!-- Title Section -->
                <tr>
                  <td style="padding: 32px 32px 16px 32px;">
                    <h2 style="margin: 0; color: #100D0A; font-size: 24px; font-weight: 700;">${jobTitle}</h2>
                    <p style="margin: 8px 0 0 0; color: #605738; font-size: 14px;">${currentDate}</p>
                    <div style="display: inline-block; margin-top: 12px; padding: 6px 12px; background: ${confidenceColor}20; border-radius: 16px;">
                      <span style="color: ${confidenceColor}; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                        ${confidence} confidence
                      </span>
                    </div>
                  </td>
                </tr>

                ${personalMessageHtml ? `<tr><td style="padding: 0 32px;">${personalMessageHtml}</td></tr>` : ''}

                <!-- Executive Summary -->
                <tr>
                  <td style="padding: 16px 32px 32px 32px;">
                    <div style="background: #FDFAF0; border-radius: 8px; padding: 24px; border-left: 4px solid #B88F5E;">
                      <h3 style="margin: 0 0 12px 0; color: #B88F5E; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Executive Summary</h3>
                      <p style="margin: 0; color: #100D0A; font-size: 15px; line-height: 1.6;">${executiveSummary}</p>
                    </div>
                  </td>
                </tr>

                <!-- Top Recommendation -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="border: 2px solid #B88F5E; border-radius: 12px; padding: 24px; background: linear-gradient(135deg, #FDFAF0 0%, #FFFFFF 100%);">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                          <span style="display: inline-block; background: #B88F5E; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">★ Top Pick</span>
                          <h3 style="margin: 8px 0 0 0; color: #100D0A; font-size: 22px; font-weight: 700;">${topRecommendation.name}</h3>
                        </div>
                        <div style="text-align: center;">
                          <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #93B1FF 0%, #7a9ce8 100%); display: flex; align-items: center; justify-content: center;">
                            <span style="color: #100D0A; font-size: 20px; font-weight: 700;">${topRecommendation.score}</span>
                          </div>
                        </div>
                      </div>
                      <h4 style="margin: 0 0 8px 0; color: #605738; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Key Strengths</h4>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${strengthsHtml}
                      </ul>
                      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E5E5;">
                        <p style="margin: 0; color: #605738; font-size: 14px; line-height: 1.5;"><strong style="color: #100D0A;">Why this candidate:</strong> ${topRecommendation.whyChosen}</p>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Rankings -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <h3 style="margin: 0 0 16px 0; color: #100D0A; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Candidate Rankings</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${rankingsHtml}
                    </table>
                  </td>
                </tr>

                <!-- Key Insights -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <div style="background: #F8F8F8; border-radius: 8px; padding: 24px;">
                      <h3 style="margin: 0 0 12px 0; color: #93B1FF; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Key Insights</h3>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${insightsHtml}
                      </ul>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #100D0A; padding: 24px 32px; text-align: center;">
                    <p style="margin: 0; color: #FDFAF0; font-size: 12px;">
                      This report is confidential and intended for internal use only.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #605738; font-size: 11px;">
                      Generated by Young Recruitment Platform
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Young Recruitment <noreply@young-id.com>",
      to: [recipientEmail],
      subject: `Executive Report: ${jobTitle} - Candidate Evaluation`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending executive report:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
