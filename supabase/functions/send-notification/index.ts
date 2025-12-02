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
  | 'business_case_invite'
  | 'business_case_reminder'
  | 'status_update'
  | 'interview_scheduled'
  | 'decision_offer'
  | 'decision_rejection';

interface NotificationRequest {
  applicationId: string;
  type: NotificationType;
  customMessage?: string;
  interviewDate?: string;
  interviewTime?: string;
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
  interviewTime?: string
): { subject: string; html: string } {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: ${brandColors.cream};
    color: ${brandColors.boldBlack};
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background-color: ${brandColors.gold};
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
  `;

  const headerStyle = `
    color: ${brandColors.youngBlue};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
  `;

  const templates: Record<NotificationType, { subject: string; html: string }> = {
    application_received: {
      subject: `Application Received - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">Thank You for Applying!</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            We've received your application for the <strong>${jobTitle}</strong> position at Young. 
            Thank you for your interest in joining our team!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>What's Next?</strong><br/>
            You'll receive a link to complete our Business Case assessment. This helps us understand 
            your approach to real-world challenges and gives you a glimpse into the kind of work we do.
          </p>
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : ''}
          <p style="font-size: 16px; line-height: 1.6;">
            We'll be in touch soon with the next steps.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Young Team</strong>
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">Unite to Disrupt</p>
        </div>
      `,
    },
    business_case_invite: {
      subject: `Complete Your Business Case - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">Time to Show Your Skills!</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Great news! Your application for <strong>${jobTitle}</strong> has moved to the next stage.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Please complete our Business Case assessment to continue the process. This involves answering 
            a few video questions that help us understand your problem-solving approach.
          </p>
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : ''}
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Young Team</strong>
          </p>
        </div>
      `,
    },
    business_case_reminder: {
      subject: `Reminder: Complete Your Business Case - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">Don't Miss Out!</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            We noticed you haven't completed the Business Case for the <strong>${jobTitle}</strong> position yet.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            We'd love to see your responses! Please complete it at your earliest convenience to continue 
            the application process.
          </p>
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : ''}
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Young Team</strong>
          </p>
        </div>
      `,
    },
    status_update: {
      subject: `Application Update - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">Application Update</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            We wanted to update you on your application for <strong>${jobTitle}</strong>.
          </p>
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : '<p style="font-size: 16px; line-height: 1.6;">Your application is currently under review. We\'ll be in touch soon with more details.</p>'}
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Young Team</strong>
          </p>
        </div>
      `,
    },
    interview_scheduled: {
      subject: `Interview Scheduled - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">Interview Invitation</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Congratulations! We'd like to invite you to an interview for the <strong>${jobTitle}</strong> position.
          </p>
          ${interviewDate && interviewTime ? `
            <div style="background: ${brandColors.youngBlue}20; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 18px; margin: 0;"><strong>📅 Date:</strong> ${interviewDate}</p>
              <p style="font-size: 18px; margin: 10px 0 0;"><strong>⏰ Time:</strong> ${interviewTime}</p>
            </div>
          ` : ''}
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : ''}
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>How to Prepare:</strong>
          </p>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>Review the job description and requirements</li>
            <li>Prepare examples of your relevant experience</li>
            <li>Think about questions you'd like to ask us</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            We look forward to meeting you!<br/>
            <strong>The Young Team</strong>
          </p>
        </div>
      `,
    },
    decision_offer: {
      subject: `Great News! - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">🎉 Congratulations!</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            We're thrilled to inform you that you've been selected for the <strong>${jobTitle}</strong> position at Young!
          </p>
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : '<p style="font-size: 16px; line-height: 1.6;">We\'ll be sending you the formal offer details shortly.</p>'}
          <p style="font-size: 16px; line-height: 1.6;">
            Welcome to the team!
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Young Team</strong>
          </p>
        </div>
      `,
    },
    decision_rejection: {
      subject: `Update on Your Application - ${jobTitle}`,
      html: `
        <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="${headerStyle}">Thank You for Applying</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${candidateName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your interest in the <strong>${jobTitle}</strong> position at Young and for 
            taking the time to go through our application process.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            After careful consideration, we've decided to move forward with other candidates whose 
            experience more closely matches our current needs.
          </p>
          ${customMessage ? `<p style="font-size: 16px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 8px;">${customMessage}</p>` : ''}
          <p style="font-size: 16px; line-height: 1.6;">
            We encourage you to apply for future opportunities that match your skills and experience. 
            We wish you all the best in your career journey.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Young Team</strong>
          </p>
        </div>
      `,
    },
  };

  return templates[type];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, type, customMessage, interviewDate, interviewTime }: NotificationRequest = await req.json();

    console.log(`Processing notification: ${type} for application: ${applicationId}`);

    // Fetch application with job details and candidate info
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_id,
        candidate_name,
        candidate_email,
        jobs (title)
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Error fetching application:", appError);
      throw new Error("Application not found");
    }

    console.log("Application found:", application);

    // For anonymous applications, use candidate_name and candidate_email from application
    // For authenticated applications, fetch from profiles table
    let candidateName = application.candidate_name;
    let candidateEmail = application.candidate_email;

    if (application.candidate_id) {
      // Fetch candidate profile for authenticated users
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", application.candidate_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // Override with profile data if available
      if (profile) {
        candidateName = profile.full_name || candidateName;
        candidateEmail = profile.email || candidateEmail;
      }
    }

    const jobTitle = (application.jobs as any)?.title || "Position";

    console.log(`Candidate: ${candidateName}, Email: ${candidateEmail}, Job: ${jobTitle}`);

    if (!candidateEmail) {
      throw new Error("Candidate email not found");
    }

    console.log(`Sending ${type} email to ${candidateEmail} for ${jobTitle}`);

    // Get email template
    const { subject, html } = getEmailTemplate(
      type,
      candidateName,
      jobTitle,
      customMessage,
      interviewDate,
      interviewTime
    );

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Young Recruitment <onboarding@resend.dev>",
      to: [candidateEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the notification
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        application_id: applicationId,
        notification_type: type,
        recipient_email: candidateEmail,
        subject,
        status: "sent",
      });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);

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
