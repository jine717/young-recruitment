import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const recruiters = [
      { email: "management@ytalents.nl", password: "Ymanagement123!", name: "Management", role: "management" },
      { email: "admin@ytalents.nl", password: "Admin123!", name: "Admin", role: "admin" },
    ];

    const results = [];

    for (const recruiter of recruiters) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === recruiter.email);

      if (existingUser) {
        results.push({ email: recruiter.email, status: "already exists" });
        continue;
      }

      // Create user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: recruiter.email,
        password: recruiter.password,
        email_confirm: true,
        user_metadata: { full_name: recruiter.name }
      });

      if (userError) {
        results.push({ email: recruiter.email, status: "error", error: userError.message });
        continue;
      }

      // Add role (management or recruiter)
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userData.user.id, role: recruiter.role || "recruiter" });

      if (roleError) {
        results.push({ email: recruiter.email, status: "created but role failed", error: roleError.message });
      } else {
        results.push({ email: recruiter.email, status: "created with recruiter role", name: recruiter.name });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
