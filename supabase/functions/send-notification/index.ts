import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 
  | 'application_received'
  | 'status_in_review'
  | 'status_reviewed'
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'decision_offer'
  | 'decision_rejection';

interface NotificationRequest {
  applicationId: string;
  type: NotificationType;
  customMessage?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
  location?: string;
  interviewType?: 'video' | 'phone' | 'in_person';
}

// Young brand colors
const brandColors = {
  cream: '#FDFAF0',
  boldBlack: '#100D0A',
  youngBlue: '#93B1FF',
  gold: '#B88F5E',
  khaki: '#605738',
};

function getEmailTemplate(
  type: NotificationType,
  candidateName: string,
  jobTitle: string,
  customMessage?: string,
  interviewDate?: string,
  interviewTime?: string,
  meetingLink?: string,
  location?: string,
  interviewType?: 'video' | 'phone' | 'in_person'
): { subject: string; html: string } {
  
  // Helper to generate meeting details section
  const getMeetingDetailsHtml = () => {
    if (interviewType === 'in_person' && location) {
      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
          <tr>
            <td style="background: rgba(96, 87, 56, 0.1); padding: 15px; border-radius: 8px;">
              <p style="font-size: 14px; margin: 0 0 8px 0; font-weight: 600; color: ${brandColors.boldBlack};">📍 Location:</p>
              <p style="font-size: 16px; margin: 0; color: ${brandColors.boldBlack};">${location}</p>
            </td>
          </tr>
        </table>
      `;
    } else if (meetingLink) {
      const typeLabel = interviewType === 'phone' ? '📞 Phone Call' : '📹 Video Call';
      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
          <tr>
            <td style="background: rgba(147, 177, 255, 0.1); padding: 15px; border-radius: 8px;">
              <p style="font-size: 14px; margin: 0 0 8px 0; font-weight: 600; color: ${brandColors.boldBlack};">${typeLabel}</p>
              <p style="font-size: 14px; margin: 0 0 12px 0; color: ${brandColors.khaki}; word-break: break-all;">${meetingLink}</p>
              <a href="${meetingLink}" target="_blank" style="display: inline-block; background: ${brandColors.youngBlue}; color: ${brandColors.boldBlack}; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Join Meeting</a>
            </td>
          </tr>
        </table>
      `;
    }
    return '';
  };
  
  // Brand text logo in Bold Black with Young-style typography
  const logoHtml = `
    <div style="text-align: center; margin: 0 auto 30px;">
      <span style="font-family: 'Arial Black', Helvetica, sans-serif; font-size: 36px; font-weight: 900; color: ${brandColors.boldBlack}; letter-spacing: 6px;">YOUNG.</span>
    </div>
  `;

  const wrapInEmailTemplate = (content: string, preheaderText: string): string => {
    return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Young Recruitment</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Preheader Text -->
  <div style="display: none; font-size: 1px; color: #f4f4f4; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheaderText}
  </div>
  
  <!-- Email Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 10px;">
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: ${brandColors.cream}; border-radius: 8px; overflow: hidden;" class="email-container">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              ${logoHtml}
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px; color: ${brandColors.boldBlack};">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: ${brandColors.boldBlack}; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.cream}; font-weight: 600;">
                Unite to Disrupt
              </p>
              <p style="margin: 0 0 15px 0; font-size: 12px; color: ${brandColors.khaki};">
                © ${new Date().getFullYear()} Young Recruitment. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: ${brandColors.khaki};">
                This email was sent regarding your application at Young.<br>
                If you have questions, please contact us at <a href="mailto:recruitment@young-id.com" style="color: ${brandColors.youngBlue}; text-decoration: none;">recruitment@young-id.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const templates: Record<NotificationType, { subject: string; content: string; preheader: string }> = {
    application_received: {
      subject: `Application Received - ${jobTitle}`,
      preheader: `Thank you for applying to ${jobTitle} at Young. We've received your application!`,
      content: `
        <h1 style="color: ${brandColors.youngBlue}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Thank You for Applying!</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          We've received your application for the <strong>${jobTitle}</strong> position at Young. 
          Thank you for your interest in joining our team!
        </p>
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : ''}
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Our team will carefully review your application and we'll be in touch soon with the next steps in the process.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Best regards,<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
    status_in_review: {
      subject: `Your Application is Under Review - ${jobTitle}`,
      preheader: `Good news! Your application for ${jobTitle} is now being reviewed by our team.`,
      content: `
        <h1 style="color: ${brandColors.youngBlue}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Your Application is Being Reviewed</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Great news! Your application for the <strong>${jobTitle}</strong> position has been opened and is now being actively reviewed by our recruitment team.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: rgba(147, 177, 255, 0.15); padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.youngBlue};">
              <p style="font-size: 16px; margin: 0; font-weight: 600; color: ${brandColors.boldBlack};">📋 What happens next?</p>
              <p style="font-size: 14px; margin: 10px 0 0 0; color: ${brandColors.khaki};">
                Our team is carefully evaluating your qualifications, experience, and how you align with the role. This typically takes a few business days.
              </p>
            </td>
          </tr>
        </table>
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : ''}
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          We appreciate your patience and will keep you updated on the progress of your application.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Best regards,<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
    status_reviewed: {
      subject: `Application Review Complete - ${jobTitle}`,
      preheader: `We've completed our initial review of your application for ${jobTitle}.`,
      content: `
        <h1 style="color: ${brandColors.youngBlue}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Initial Review Complete</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          We've completed our initial review of your application for the <strong>${jobTitle}</strong> position.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: rgba(184, 143, 94, 0.15); padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.gold};">
              <p style="font-size: 16px; margin: 0; font-weight: 600; color: ${brandColors.boldBlack};">✅ Review Status: Complete</p>
              <p style="font-size: 14px; margin: 10px 0 0 0; color: ${brandColors.khaki};">
                Your application has passed our initial screening. Our team is now determining the next steps in the process.
              </p>
            </td>
          </tr>
        </table>
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : ''}
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          We'll be in touch shortly with more information about the next stage of the selection process.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Best regards,<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
    interview_scheduled: {
      subject: `Interview Scheduled - ${jobTitle}`,
      preheader: `Congratulations! You've been invited to interview for ${jobTitle}.`,
      content: `
        <h1 style="color: ${brandColors.youngBlue}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Interview Invitation</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Congratulations! We'd like to invite you to an interview for the <strong>${jobTitle}</strong> position.
        </p>
        ${interviewDate && interviewTime ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: rgba(147, 177, 255, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.youngBlue};">
              <p style="font-size: 18px; margin: 0 0 10px 0;"><strong>📅 Date:</strong> ${interviewDate}</p>
              <p style="font-size: 18px; margin: 0;"><strong>⏰ Time:</strong> ${interviewTime}</p>
            </td>
          </tr>
        </table>
        ` : ''}
        ${getMeetingDetailsHtml()}
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : ''}
        <p style="font-size: 16px; line-height: 1.6; margin: 20px 0 10px 0;">
          <strong>How to Prepare:</strong>
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 8px 0; font-size: 16px; line-height: 1.6;">• Review the job description and requirements</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 16px; line-height: 1.6;">• Prepare examples of your relevant experience</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 16px; line-height: 1.6;">• Think about questions you'd like to ask us</td>
          </tr>
        </table>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          We look forward to meeting you!<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
    interview_rescheduled: {
      subject: `Interview Rescheduled - ${jobTitle}`,
      preheader: `Your interview for ${jobTitle} has been rescheduled.`,
      content: `
        <h1 style="color: ${brandColors.gold}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Interview Rescheduled</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Your interview for the <strong>${jobTitle}</strong> position has been rescheduled. Please note the new date and time below.
        </p>
        ${interviewDate && interviewTime ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: rgba(184, 143, 94, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid ${brandColors.gold};">
              <p style="font-size: 18px; margin: 0 0 10px 0;"><strong>📅 New Date:</strong> ${interviewDate}</p>
              <p style="font-size: 18px; margin: 0;"><strong>⏰ New Time:</strong> ${interviewTime}</p>
            </td>
          </tr>
        </table>
        ` : ''}
        ${getMeetingDetailsHtml()}
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : ''}
        <p style="font-size: 16px; line-height: 1.6; margin: 20px 0 10px 0;">
          <strong>Reminder - How to Prepare:</strong>
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 8px 0; font-size: 16px; line-height: 1.6;">• Review the job description and requirements</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 16px; line-height: 1.6;">• Prepare examples of your relevant experience</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 16px; line-height: 1.6;">• Think about questions you'd like to ask us</td>
          </tr>
        </table>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          We look forward to meeting you!<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
    decision_offer: {
      subject: `Great News! - ${jobTitle}`,
      preheader: `Congratulations! You've been selected for ${jobTitle} at Young!`,
      content: `
        <h1 style="color: ${brandColors.youngBlue}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">🎉 Congratulations!</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          We're thrilled to inform you that you've been selected for the <strong>${jobTitle}</strong> position at Young!
        </p>
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : '<p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">We\'ll be sending you the formal offer details shortly.</p>'}
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Welcome to the team! We're excited to have you join us.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Best regards,<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
    decision_rejection: {
      subject: `Update on Your Application - ${jobTitle}`,
      preheader: `Thank you for your interest in ${jobTitle} at Young.`,
      content: `
        <h1 style="color: ${brandColors.youngBlue}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">Thank You for Applying</h1>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${candidateName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to apply.
        </p>
        ${customMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
              ${customMessage}
            </td>
          </tr>
        </table>
        ` : '<p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>'}
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          We encourage you to apply for future positions that match your skills and experience. We wish you the best in your job search and future endeavors.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
          Best regards,<br/>
          <strong>The Young Team</strong>
        </p>
      `,
    },
  };

  const template = templates[type];
  return {
    subject: template.subject,
    html: wrapInEmailTemplate(template.content, template.preheader),
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, type, customMessage, interviewDate, interviewTime, meetingLink, location, interviewType }: NotificationRequest = await req.json();

    console.log(`Processing notification request: type=${type}, applicationId=${applicationId}`);

    // Fetch application with job details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_name,
        candidate_email,
        jobs (
          title
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Failed to fetch application:", appError);
      return new Response(
        JSON.stringify({ success: false, error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidateName = application.candidate_name || "Candidate";
    const candidateEmail = application.candidate_email;
    const jobTitle = (application.jobs as any)?.title || "Position";

    if (!candidateEmail) {
      console.error("No candidate email found");
      return new Response(
        JSON.stringify({ success: false, error: "No candidate email found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email content
    const { subject, html } = getEmailTemplate(
      type,
      candidateName,
      jobTitle,
      customMessage,
      interviewDate,
      interviewTime,
      meetingLink,
      location,
      interviewType
    );

    console.log(`Sending email to ${candidateEmail}: ${subject}`);

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Young Recruitment <onboarding@resend.dev>",
      to: [candidateEmail],
      subject,
      html,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      
      // Log failed notification
      await supabase.from("notification_logs").insert({
        application_id: applicationId,
        notification_type: type,
        recipient_email: candidateEmail,
        subject,
        status: "failed",
        error_message: emailError.message,
      });

      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailData);

    // Log successful notification
    await supabase.from("notification_logs").insert({
      application_id: applicationId,
      notification_type: type,
      recipient_email: candidateEmail,
      subject,
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
