import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

// Signed URL expiration: 4 hours (14400 seconds)
const SIGNED_URL_EXPIRATION = 14400;

/**
 * Get CORS headers with dynamic origin validation
 * Validates the request origin against an allowed list from environment
 */
function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get('origin') || '';
  
  // Read allowed origins from environment (comma-separated)
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS');
  
  let allowedOrigins: string[];
  
  if (allowedOriginsEnv) {
    // Production: use configured origins
    allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim());
  } else {
    // Development fallback: allow localhost on common ports
    allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
    ];
    console.log('ALLOWED_ORIGINS not set, using localhost fallback');
  }
  
  // Check if request origin is in allowed list
  const isAllowed = allowedOrigins.some(allowed => {
    // Support wildcard subdomain matching (e.g., *.lovableproject.com)
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\./g, '\\.').replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(requestOrigin);
    }
    return allowed === requestOrigin;
  });
  
  // If origin is allowed, echo it back; otherwise use first allowed origin
  const origin = isAllowed ? requestOrigin : allowedOrigins[0];
  
  if (!isAllowed && requestOrigin) {
    console.warn(`Origin '${requestOrigin}' not in allowed list, defaulting to: ${origin}`);
  }
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

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
