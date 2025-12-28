import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract file path from a Supabase storage URL
function extractStoragePath(url: string, bucketName: string): string | null {
  if (!url) return null;
  
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/(?:public|sign)/${bucketName}/(.+)`));
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'applicationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting application with cascade:', applicationId);

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

    // 1. Get application details to find CV and DISC URLs
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('cv_url, disc_url')
      .eq('id', applicationId)
      .maybeSingle();

    if (appError) {
      console.error('Error fetching application:', appError);
      return new Response(
        JSON.stringify({ error: appError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get all business case responses for this application to find video URLs
    const { data: bcqResponses, error: bcqError } = await supabaseAdmin
      .from('business_case_responses')
      .select('video_url')
      .eq('application_id', applicationId);

    if (bcqError) {
      console.error('Error fetching BCQ responses:', bcqError);
    }

    // 3. Collect all files to delete
    const filesToDelete: { bucket: string; path: string }[] = [];

    // CV file
    if (application.cv_url) {
      const cvPath = extractStoragePath(application.cv_url, 'cvs');
      if (cvPath) {
        filesToDelete.push({ bucket: 'cvs', path: cvPath });
      }
    }

    // DISC file
    if (application.disc_url) {
      const discPath = extractStoragePath(application.disc_url, 'disc-assessments');
      if (discPath) {
        filesToDelete.push({ bucket: 'disc-assessments', path: discPath });
      }
    }

    // BCQ video files
    if (bcqResponses) {
      for (const response of bcqResponses) {
        if (response.video_url) {
          const videoPath = extractStoragePath(response.video_url, 'business-case-videos');
          if (videoPath) {
            filesToDelete.push({ bucket: 'business-case-videos', path: videoPath });
          }
        }
      }
    }

    console.log('Files to delete:', filesToDelete);

    // 4. Delete files from storage
    const deletionResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: [],
    };

    for (const file of filesToDelete) {
      try {
        const { error: deleteError } = await supabaseAdmin.storage
          .from(file.bucket)
          .remove([file.path]);

        if (deleteError) {
          console.error(`Failed to delete ${file.bucket}/${file.path}:`, deleteError);
          deletionResults.failed.push(`${file.bucket}/${file.path}`);
        } else {
          console.log(`Deleted ${file.bucket}/${file.path}`);
          deletionResults.success.push(`${file.bucket}/${file.path}`);
        }
      } catch (err) {
        console.error(`Error deleting ${file.bucket}/${file.path}:`, err);
        deletionResults.failed.push(`${file.bucket}/${file.path}`);
      }
    }

    // 5. Delete the application record (cascades to related tables via foreign keys)
    const { error: deleteAppError } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (deleteAppError) {
      console.error('Error deleting application:', deleteAppError);
      return new Response(
        JSON.stringify({ 
          error: deleteAppError.message,
          filesDeleted: deletionResults.success,
          filesFailed: deletionResults.failed
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Application deleted successfully:', applicationId);

    return new Response(
      JSON.stringify({ 
        success: true,
        filesDeleted: deletionResults.success,
        filesFailed: deletionResults.failed
      }),
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
