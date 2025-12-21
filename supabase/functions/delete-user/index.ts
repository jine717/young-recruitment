import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting user:', userId);

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Clear foreign key references before deleting user
    // This handles cases where user has created jobs or been assigned applications
    console.log('Clearing foreign key references for user:', userId);
    
    // Clear assigned_to in applications
    const { error: appError } = await supabaseAdmin
      .from('applications')
      .update({ assigned_to: null })
      .eq('assigned_to', userId);
    
    if (appError) {
      console.log('Note: Error clearing applications assigned_to:', appError.message);
    }

    // Clear created_by in jobs
    const { error: jobsCreatedError } = await supabaseAdmin
      .from('jobs')
      .update({ created_by: null })
      .eq('created_by', userId);
    
    if (jobsCreatedError) {
      console.log('Note: Error clearing jobs created_by:', jobsCreatedError.message);
    }

    // Clear linkedin_posted_by in jobs
    const { error: jobsPostedError } = await supabaseAdmin
      .from('jobs')
      .update({ linkedin_posted_by: null })
      .eq('linkedin_posted_by', userId);
    
    if (jobsPostedError) {
      console.log('Note: Error clearing jobs linkedin_posted_by:', jobsPostedError.message);
    }

    // Delete user from auth.users (cascades to profiles and user_roles)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
