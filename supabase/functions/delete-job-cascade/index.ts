import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user has recruiter/admin role
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['recruiter', 'admin']);

    if (!roles || roles.length === 0) {
      throw new Error('Insufficient permissions');
    }

    const { jobId } = await req.json();
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    console.log(`Starting cascade deletion for job: ${jobId}`);

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    // Get all applications for this job
    const { data: applications } = await supabase
      .from('applications')
      .select('id, cv_url, disc_url')
      .eq('job_id', jobId);

    const applicationIds = applications?.map(a => a.id) || [];
    console.log(`Found ${applicationIds.length} applications to delete`);

    // Get business case responses for storage cleanup
    const { data: bcResponses } = await supabase
      .from('business_case_responses')
      .select('video_url')
      .in('application_id', applicationIds.length > 0 ? applicationIds : ['none']);

    // Track deletion stats
    const stats = {
      files: { cvs: 0, discs: 0, videos: 0 },
      records: {
        aiEvaluations: 0,
        documentAnalyses: 0,
        interviewEvaluations: 0,
        interviewQuestions: 0,
        interviews: 0,
        hiringDecisions: 0,
        recruiterNotes: 0,
        notificationLogs: 0,
        businessCaseResponses: 0,
        applications: 0,
        businessCases: 0,
      }
    };

    // Delete files from storage buckets
    if (applications && applications.length > 0) {
      // Delete CVs
      const cvPaths = applications
        .filter(a => a.cv_url)
        .map(a => {
          const url = a.cv_url;
          const match = url.match(/\/cvs\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (cvPaths.length > 0) {
        const { error: cvError } = await supabase.storage.from('cvs').remove(cvPaths);
        if (!cvError) stats.files.cvs = cvPaths.length;
        else console.error('Error deleting CVs:', cvError);
      }

      // Delete DISC assessments
      const discPaths = applications
        .filter(a => a.disc_url)
        .map(a => {
          const url = a.disc_url;
          const match = url.match(/\/disc-assessments\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (discPaths.length > 0) {
        const { error: discError } = await supabase.storage.from('disc-assessments').remove(discPaths);
        if (!discError) stats.files.discs = discPaths.length;
        else console.error('Error deleting DISCs:', discError);
      }
    }

    // Delete business case videos
    if (bcResponses && bcResponses.length > 0) {
      const videoPaths = bcResponses
        .filter(r => r.video_url)
        .map(r => {
          const url = r.video_url;
          const match = url.match(/\/business-case-videos\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (videoPaths.length > 0) {
        const { error: videoError } = await supabase.storage.from('business-case-videos').remove(videoPaths);
        if (!videoError) stats.files.videos = videoPaths.length;
        else console.error('Error deleting videos:', videoError);
      }
    }

    // Delete database records in correct order (respecting dependencies)
    if (applicationIds.length > 0) {
      // AI evaluations
      const { count: aiCount } = await supabase
        .from('ai_evaluations')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.aiEvaluations = aiCount || 0;

      // Document analyses
      const { count: docCount } = await supabase
        .from('document_analyses')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.documentAnalyses = docCount || 0;

      // Interview evaluations
      const { count: evalCount } = await supabase
        .from('interview_evaluations')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.interviewEvaluations = evalCount || 0;

      // Interview questions
      const { count: questionsCount } = await supabase
        .from('interview_questions')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.interviewQuestions = questionsCount || 0;

      // Interviews
      const { count: interviewsCount } = await supabase
        .from('interviews')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.interviews = interviewsCount || 0;

      // Hiring decisions
      const { count: decisionsCount } = await supabase
        .from('hiring_decisions')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.hiringDecisions = decisionsCount || 0;

      // Recruiter notes
      const { count: notesCount } = await supabase
        .from('recruiter_notes')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.recruiterNotes = notesCount || 0;

      // Notification logs
      const { count: logsCount } = await supabase
        .from('notification_logs')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.notificationLogs = logsCount || 0;

      // Business case responses
      const { count: responsesCount } = await supabase
        .from('business_case_responses')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);
      stats.records.businessCaseResponses = responsesCount || 0;

      // Applications
      const { count: appsCount } = await supabase
        .from('applications')
        .delete({ count: 'exact' })
        .eq('job_id', jobId);
      stats.records.applications = appsCount || 0;
    }

    // Business cases
    const { count: bcCount } = await supabase
      .from('business_cases')
      .delete({ count: 'exact' })
      .eq('job_id', jobId);
    stats.records.businessCases = bcCount || 0;

    // Finally delete the job
    const { error: deleteJobError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (deleteJobError) {
      throw new Error(`Failed to delete job: ${deleteJobError.message}`);
    }

    console.log('Cascade deletion completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        jobTitle: job.title,
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-job-cascade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
