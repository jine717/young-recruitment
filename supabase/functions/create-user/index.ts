import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  fullName: string;
  password?: string;
  sendInvite: boolean;
  roles: string[];
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, fullName, password, sendInvite, roles }: CreateUserRequest = await req.json();

    // Validate required fields
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one role is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sendInvite && (!password || password.length < 6)) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId: string;

    if (sendInvite) {
      // Send email invitation
      console.log(`Sending invite to ${email}`);
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });

      if (error) {
        console.error("Invite error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = data.user.id;
    } else {
      // Create user with password (no email sent)
      console.log(`Creating user ${email} with password`);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name: fullName },
      });

      if (error) {
        console.error("Create user error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = data.user.id;
    }

    // Assign roles
    console.log(`Assigning roles to user ${userId}:`, roles);
    for (const role of roles) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (roleError) {
        console.error(`Error assigning role ${role}:`, roleError);
        // Continue with other roles even if one fails
      }
    }

    console.log(`User ${email} created successfully with ID: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
