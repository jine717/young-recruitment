import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Loader2, CheckCircle, Send } from 'lucide-react';
import { useJob } from '@/hooks/useJobs';
import { useBusinessCases } from '@/hooks/useBusinessCase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSendNotification } from '@/hooks/useNotifications';
import { z } from 'zod';
import Navbar from '@/components/Navbar';

const applicationSchema = z.object({
  candidateName: z.string().min(2, 'Name must be at least 2 characters'),
  candidateEmail: z.string().email('Please enter a valid email'),
  cvFile: z.instanceof(File, { message: 'Please upload your CV' }),
  discFile: z.instanceof(File, { message: 'Please upload your DISC assessment' }),
});

export default function Apply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: businessCases, isLoading: businessCasesLoading } = useBusinessCases(id);
  const { toast } = useToast();
  const sendNotification = useSendNotification();

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [discFile, setDiscFile] = useState<File | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
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

  const uploadFile = async (file: File, bucket: string, identifier: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `anonymous/${identifier}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!job) return;

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!candidateName || candidateName.length < 2) newErrors.candidateName = 'Name must be at least 2 characters';
    if (!candidateEmail || !z.string().email().safeParse(candidateEmail).success) newErrors.candidateEmail = 'Please enter a valid email';
    if (!cvFile) newErrors.cvFile = 'Please upload your CV';
    if (!discFile) newErrors.discFile = 'Please upload your DISC assessment';

    // Validate business case responses
    businessCases?.forEach((bc) => {
      if (!responses[bc.id] || responses[bc.id].trim().length < 10) {
        newErrors[`response_${bc.id}`] = 'Please provide a detailed response (at least 10 characters)';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate unique identifier for file paths
      const identifier = `${Date.now()}-${candidateEmail.replace(/[^a-z0-9]/gi, '_')}`;

      // Upload files
      const cvPath = await uploadFile(cvFile!, 'cvs', identifier);
      const discPath = await uploadFile(discFile!, 'disc-assessments', identifier);

      // Generate application ID client-side to avoid SELECT permission requirement
      const applicationId = crypto.randomUUID();

      // Create application
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          id: applicationId,
          job_id: job.id,
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          cv_url: cvPath,
          disc_url: discPath,
          status: 'under_review',
          business_case_completed: true,
          business_case_completed_at: new Date().toISOString(),
        });

      if (appError) throw appError;

      // Create business case responses
      if (businessCases && businessCases.length > 0) {
        const responseInserts = businessCases.map((bc) => ({
          application_id: applicationId,
          business_case_id: bc.id,
          text_response: responses[bc.id],
          completed_at: new Date().toISOString(),
        }));

        const { error: respError } = await supabase
          .from('business_case_responses')
          .insert(responseInserts);

        if (respError) throw respError;
      }

      // Send notification (fire and forget)
      sendNotification.mutate({ 
        applicationId: applicationId, 
        type: 'application_received' 
      });

      // Trigger AI analysis (fire and forget)
      supabase.functions.invoke('analyze-candidate', {
        body: { applicationId: applicationId }
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Application error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (jobLoading || businessCasesLoading) {
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl mb-4">APPLICATION SUBMITTED</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Thank you for applying for <strong>{job.title}</strong>. We've received your application and will review it carefully.
            </p>
            <p className="text-muted-foreground mb-8">
              You'll receive an email at <strong>{candidateEmail}</strong> with updates about your application status.
            </p>
            <Button asChild size="lg">
              <Link to="/jobs">Browse More Positions</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Application Form */}
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Details
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl mb-2">
              APPLY FOR {job.title.toUpperCase()}
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete the form below to submit your application.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                    {errors.candidateName && (
                      <p className="text-sm text-destructive">{errors.candidateName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.candidateEmail && (
                      <p className="text-sm text-destructive">{errors.candidateEmail}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Upload your CV and DISC assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CV Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cv">CV / Resume *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, setCvFile)}
                      className="hidden"
                      disabled={isSubmitting}
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
                  <Label htmlFor="disc">DISC Assessment Results *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="disc"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, setDiscFile)}
                      className="hidden"
                      disabled={isSubmitting}
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
              </CardContent>
            </Card>

            {/* Business Case Questions */}
            {businessCases && businessCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Business Case Questions</CardTitle>
                  <CardDescription>
                    Please answer the following questions to help us understand your fit for this role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {businessCases.map((bc, index) => (
                    <div 
                      key={bc.id} 
                      className="relative p-6 rounded-lg border border-border bg-muted/30 space-y-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/50"
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-lg shadow-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1 pt-1">
                          <h3 className="text-lg font-semibold text-foreground">{bc.question_title}</h3>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {bc.question_description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Answer Input */}
                      <div className="pt-2">
                        <Textarea
                          value={responses[bc.id] || ''}
                          onChange={(e) => setResponses(prev => ({ ...prev, [bc.id]: e.target.value }))}
                          placeholder="Write your answer here..."
                          rows={5}
                          disabled={isSubmitting}
                          className="resize-none bg-background border-border/50 focus:border-primary transition-colors"
                        />
                        {errors[`response_${bc.id}`] && (
                          <p className="text-sm text-destructive mt-2">{errors[`response_${bc.id}`]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}