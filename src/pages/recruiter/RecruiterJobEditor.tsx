import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateJob, useUpdateJob } from '@/hooks/useJobsMutation';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useJobBusinessCases, useCreateBusinessCase, useUpdateBusinessCase, useDeleteBusinessCase } from '@/hooks/useBusinessCasesMutation';
import { Plus, X, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BusinessCaseQuestionsEditor, { BusinessCaseQuestion } from '@/components/recruiter/BusinessCaseQuestionsEditor';

type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
type JobStatus = 'draft' | 'published' | 'closed';

export default function RecruiterJobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user, hasAccess, isLoading: roleLoading } = useRoleCheck(['recruiter', 'admin']);

  const { data: departments } = useDepartments();
  const { data: existingBusinessCases, isLoading: businessCasesLoading } = useJobBusinessCases(id);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const createBusinessCase = useCreateBusinessCase();
  const updateBusinessCase = useUpdateBusinessCase();
  const deleteBusinessCase = useDeleteBusinessCase();

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    type: 'full-time' as JobType,
    department_id: '',
    description: '',
    responsibilities: [''],
    requirements: [''],
    benefits: [''],
    tags: [''],
    status: 'draft' as JobStatus,
  });

  const [businessCaseQuestions, setBusinessCaseQuestions] = useState<BusinessCaseQuestion[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing business cases when editing
  useEffect(() => {
    if (existingBusinessCases && !businessCasesLoading) {
      setBusinessCaseQuestions(
        existingBusinessCases.map((bc) => ({
          id: bc.id,
          question_number: bc.question_number,
          question_title: bc.question_title,
          question_description: bc.question_description,
          has_text_response: bc.has_text_response,
          video_url: bc.video_url,
        }))
      );
    }
  }, [existingBusinessCases, businessCasesLoading]);

  useEffect(() => {
    if (isEditing && id) {
      const fetchJob = async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          navigate('/dashboard/jobs');
          return;
        }

        if (data) {
          setFormData({
            title: data.title,
            location: data.location,
            type: data.type as JobType,
            department_id: data.department_id || '',
            description: data.description,
            responsibilities: data.responsibilities?.length ? data.responsibilities : [''],
            requirements: data.requirements?.length ? data.requirements : [''],
            benefits: data.benefits?.length ? data.benefits : [''],
            tags: data.tags?.length ? data.tags : [''],
            status: data.status as JobStatus,
          });
        }
        setLoading(false);
      };

      fetchJob();
    }
  }, [id, isEditing, navigate]);

  const handleArrayChange = (
    field: 'responsibilities' | 'requirements' | 'benefits' | 'tags',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'responsibilities' | 'requirements' | 'benefits' | 'tags') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (
    field: 'responsibilities' | 'requirements' | 'benefits' | 'tags',
    index: number
  ) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray.length ? newArray : [''] });
  };

  const saveBusinessCases = async (jobId: string) => {
    const existingIds = existingBusinessCases?.map((bc) => bc.id) || [];
    const currentIds = businessCaseQuestions.filter((q) => q.id).map((q) => q.id!);
    
    // Delete removed questions
    const toDelete = existingIds.filter((id) => !currentIds.includes(id));
    for (const bcId of toDelete) {
      await deleteBusinessCase.mutateAsync({ id: bcId, jobId });
    }

    // Create or update questions
    for (const question of businessCaseQuestions) {
      const data = {
        job_id: jobId,
        question_number: question.question_number,
        question_title: question.question_title,
        question_description: question.question_description,
        has_text_response: question.has_text_response,
        video_url: question.video_url,
      };

      if (question.id) {
        await updateBusinessCase.mutateAsync({ id: question.id, ...data });
      } else {
        await createBusinessCase.mutateAsync(data);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published') => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const jobData = {
        ...formData,
        department_id: formData.department_id || null,
        status: saveAs,
        responsibilities: formData.responsibilities.filter((r) => r.trim()),
        requirements: formData.requirements.filter((r) => r.trim()),
        benefits: formData.benefits.filter((b) => b.trim()),
        tags: formData.tags.filter((t) => t.trim()),
      };

      let jobId: string;

      if (isEditing && id) {
        await updateJob.mutateAsync({ id, ...jobData });
        jobId = id;
      } else {
        const newJob = await createJob.mutateAsync(jobData);
        jobId = newJob.id;
      }

      // Save business case questions
      await saveBusinessCases(jobId);

      navigate('/dashboard/jobs');
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access this page</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSubmitting = isSaving || createJob.isPending || updateJob.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-3xl tracking-tight">YOUNG RECRUITMENT</Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Open Positions
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-8 px-6">
        <div className="container mx-auto max-w-4xl">
          <Link to="/dashboard/jobs" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
          
          <h1 className="font-display text-4xl md:text-5xl mb-2">
            {isEditing ? 'EDIT JOB' : 'CREATE JOB'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {isEditing ? 'Update job posting details' : 'Create a new job posting'}
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={(e) => handleSubmit(e, 'draft')}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Amsterdam, Netherlands"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="type">Job Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: JobType) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={formData.department_id}
                        onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Job description..."
                      rows={5}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.responsibilities.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                        placeholder="Add a responsibility..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('responsibilities', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('responsibilities')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Responsibility
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.requirements.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        placeholder="Add a requirement..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('requirements', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('requirements')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.benefits.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                        placeholder="Add a benefit..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('benefits', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('benefits')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Benefit
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.tags.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                        placeholder="Add a tag..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('tags', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('tags')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </CardContent>
              </Card>

              {/* Business Case Questions Section */}
              <BusinessCaseQuestionsEditor
                questions={businessCaseQuestions}
                onChange={setBusinessCaseQuestions}
                disabled={isSubmitting}
              />

              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/jobs')}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => handleSubmit(e, 'draft')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'published')}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Update & Publish' : 'Publish'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}