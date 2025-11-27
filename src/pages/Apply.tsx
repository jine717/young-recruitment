import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const applicationSchema = z.object({
  cvFile: z.instanceof(File, { message: 'Please upload your CV' }),
  discFile: z.instanceof(File, { message: 'Please upload your DISC assessment' }),
});

export default function Apply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: job, isLoading: jobLoading } = useJob(id);
  const { toast } = useToast();

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [discFile, setDiscFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/apply/${id}`);
    }
  }, [user, authLoading, navigate, id]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or Word document',
          variant: 'destructive',
        });
        return;
      }
      setFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!user || !job) return;

    // Validate
    const newErrors: Record<string, string> = {};
    if (!cvFile) newErrors.cvFile = 'Please upload your CV';
    if (!discFile) newErrors.discFile = 'Please upload your DISC assessment';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files
      const cvUrl = await uploadFile(cvFile!, 'cvs', user.id);
      const discUrl = await uploadFile(discFile!, 'disc-assessments', user.id);

      // Create application
      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          candidate_id: user.id,
          cv_url: cvUrl,
          disc_url: discUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already applied',
            description: 'You have already applied for this position.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Step 1 Complete!',
          description: 'Now complete the Business Case to finish your application.',
        });
        // Redirect to business case
        navigate(`/business-case/${application.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">JOB NOT FOUND</h1>
          <Button asChild>
            <Link to="/jobs">View All Positions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-3xl tracking-tight">
            YOUNG.
          </Link>
          <Link to="/jobs">
            <Button variant="outline">View Jobs</Button>
          </Link>
        </div>
      </nav>

      {/* Application Form */}
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Details
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-3xl">
                APPLY FOR {job.title.toUpperCase()}
              </CardTitle>
              <CardDescription>
                Upload your CV and DISC assessment to complete your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* CV Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cv">CV / Resume</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, setCvFile)}
                      className="hidden"
                    />
                    <label htmlFor="cv" className="cursor-pointer">
                      {cvFile ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <CheckCircle className="h-5 w-5" />
                          <span>{cvFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Click to upload CV (PDF or Word)
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.cvFile && (
                    <p className="text-sm text-destructive">{errors.cvFile}</p>
                  )}
                </div>

                {/* DISC Upload */}
                <div className="space-y-2">
                  <Label htmlFor="disc">DISC Assessment Results</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="disc"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, setDiscFile)}
                      className="hidden"
                    />
                    <label htmlFor="disc" className="cursor-pointer">
                      {discFile ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <CheckCircle className="h-5 w-5" />
                          <span>{discFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Click to upload DISC Assessment (PDF)
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.discFile && (
                    <p className="text-sm text-destructive">{errors.discFile}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Haven't taken the assessment?{' '}
                    <a
                      href="https://www.tonyrobbins.com/disc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Take it here
                    </a>
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
