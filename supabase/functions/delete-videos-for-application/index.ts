import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has recruiter/admin/management role
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const allowedRoles = ['recruiter', 'admin', 'management'];
    const hasPermission = userRoles?.some(r => allowedRoles.includes(r.role));
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { applicationId } = await req.json();
    
    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Missing applicationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting videos for application: ${applicationId}`);

    // Get all video URLs from business_case_responses
    const { data: responses, error: fetchError } = await supabaseAdmin
      .from('business_case_responses')
      .select('id, video_url')
      .eq('application_id', applicationId)
      .not('video_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching responses:', fetchError);
      throw fetchError;
    }

    if (!responses || responses.length === 0) {
      console.log('No videos found for application');
      return new Response(
        JSON.stringify({ success: true, deletedCount: 0, message: 'No videos to delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${responses.length} video responses`);

    // Extract video paths and delete from storage
    const videoPaths: string[] = [];
    for (const response of responses) {
      if (response.video_url) {
        // Handle both full URLs and path-only formats
        let videoPath = response.video_url;
        
        // If it's a full URL, extract the path
        if (videoPath.includes('/storage/v1/object/public/business-case-videos/')) {
          const parts = videoPath.split('/storage/v1/object/public/business-case-videos/');
          if (parts.length > 1) {
            videoPath = parts[1].split('?')[0]; // Remove query params if any
          }
        } else if (videoPath.includes('/storage/v1/object/sign/business-case-videos/')) {
          const parts = videoPath.split('/storage/v1/object/sign/business-case-videos/');
          if (parts.length > 1) {
            videoPath = parts[1].split('?')[0];
          }
        }
        
        // Decode URL-encoded paths
        videoPath = decodeURIComponent(videoPath);
        videoPaths.push(videoPath);
      }
    }

    console.log(`Video paths to delete: ${JSON.stringify(videoPaths)}`);

    // Delete videos from storage bucket
    let deletedCount = 0;
    const errors: string[] = [];

    for (const videoPath of videoPaths) {
      const { error: deleteError } = await supabaseAdmin
        .storage
        .from('business-case-videos')
        .remove([videoPath]);

      if (deleteError) {
        console.error(`Error deleting video ${videoPath}:`, deleteError);
        errors.push(`Failed to delete ${videoPath}: ${deleteError.message}`);
      } else {
        console.log(`Successfully deleted video: ${videoPath}`);
        deletedCount++;
      }
    }

    // Update database to clear video_url references
    const { error: updateError } = await supabaseAdmin
      .from('business_case_responses')
      .update({ video_url: null })
      .eq('application_id', applicationId);

    if (updateError) {
      console.error('Error updating responses:', updateError);
      throw updateError;
    }

    console.log(`Cleared video_url for ${responses.length} responses`);

    // Log deletion for audit purposes
    console.log(`Video deletion completed for application ${applicationId}: ${deletedCount}/${videoPaths.length} videos deleted`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        totalVideos: videoPaths.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully deleted ${deletedCount} video(s)` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-videos-for-application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
