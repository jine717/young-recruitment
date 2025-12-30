import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

// Signed URL expiration: 4 hours (14400 seconds)
const SIGNED_URL_EXPIRATION = 14400;

// CORS headers - using wildcard since security is enforced via JWT/BCQ token validation
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoPath, applicationId, bcqAccessToken } = await req.json();
    
    if (!videoPath) {
      throw new Error('videoPath is required');
    }

    console.log('Generating signed URL for:', videoPath);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get authorization header to check if user is authenticated
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    
    let isAuthorized = false;

    if (token) {
      // Validate token and retrieve user
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (user && !userError) {
        // Check if user has recruiter, admin, or management role
        const { data: roles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
        } else {
          const allowedRoles = ['recruiter', 'admin', 'management'];
          isAuthorized = roles?.some((r) => allowedRoles.includes(r.role)) || false;

          if (isAuthorized) {
            console.log('User authenticated with role:', roles?.map(r => r.role).join(', '));
          }
        }
      } else {
        console.log('Token user lookup failed');
      }
    } else {
      console.log('No auth token provided');
    }

    // If not authenticated via user, check bcq_access_token for anonymous candidates
    if (!isAuthorized && applicationId && bcqAccessToken) {
      console.log('Checking BCQ access token for application:', applicationId);
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .select('bcq_access_token')
        .eq('id', applicationId)
        .maybeSingle();
      
      if (!appError && application && application.bcq_access_token === bcqAccessToken) {
        // Verify the video path belongs to this application
        if (videoPath.startsWith(`${applicationId}/`)) {
          isAuthorized = true;
          console.log('BCQ access token validated for application:', applicationId);
        }
      }
    }

    if (!isAuthorized) {
      console.log('Authorization failed');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate signed URL using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('business-case-videos')
      .createSignedUrl(videoPath, SIGNED_URL_EXPIRATION);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    console.log('Signed URL generated successfully, expires in', SIGNED_URL_EXPIRATION, 'seconds');

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl,
        expiresIn: SIGNED_URL_EXPIRATION,
        expiresAt: Date.now() + (SIGNED_URL_EXPIRATION * 1000)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating signed URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
