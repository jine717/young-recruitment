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
import { useJobFixedQuestionsForEditor, useCreateJobFixedQuestion, useUpdateJobFixedQuestion, useDeleteJobFixedQuestion } from '@/hooks/useJobFixedQuestionsMutation';
import { Plus, X, Save, ArrowLeft, Loader2, Brain, FolderOpen, SaveAll, MessageSquareText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BusinessCaseQuestionsEditor, { BusinessCaseQuestion } from '@/components/recruiter/BusinessCaseQuestionsEditor';
import FixedInterviewQuestionsEditor, { FixedInterviewQuestion } from '@/components/recruiter/FixedInterviewQuestionsEditor';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { AITemplateSelector } from '@/components/recruiter/AITemplateSelector';
import { SaveTemplateDialog } from '@/components/recruiter/SaveTemplateDialog';
import { ManageTemplatesDialog } from '@/components/recruiter/ManageTemplatesDialog';

type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
type JobStatus = 'draft' | 'published' | 'closed';

export default function RecruiterJobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user, hasAccess, isLoading: roleLoading, isAdmin } = useRoleCheck(['recruiter', 'admin']);

  const { data: departments } = useDepartments();
  const { data: existingBusinessCases, isLoading: businessCasesLoading } = useJobBusinessCases(id);
  const { data: existingFixedQuestions, isLoading: fixedQuestionsLoading } = useJobFixedQuestionsForEditor(id);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const createBusinessCase = useCreateBusinessCase();
  const updateBusinessCase = useUpdateBusinessCase();
  const deleteBusinessCase = useDeleteBusinessCase();
  const createFixedQuestion = useCreateJobFixedQuestion();
  const updateFixedQuestion = useUpdateJobFixedQuestion();
  const deleteFixedQuestion = useDeleteJobFixedQuestion();

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
    ai_system_prompt: '',
    ai_interview_prompt: '',
  });

  const [businessCaseQuestions, setBusinessCaseQuestions] = useState<BusinessCaseQuestion[]>([]);
  const [fixedInterviewQuestions, setFixedInterviewQuestions] = useState<FixedInterviewQuestion[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);

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

  // Load existing fixed interview questions when editing
  useEffect(() => {
    if (existingFixedQuestions && !fixedQuestionsLoading) {
      setFixedInterviewQuestions(
        existingFixedQuestions.map((fq: any) => ({
          id: fq.id,
          question_order: fq.question_order,
          question_text: fq.question_text,
          category: fq.category,
          priority: fq.priority,
        }))
      );
    }
  }, [existingFixedQuestions, fixedQuestionsLoading]);

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
            ai_system_prompt: data.ai_system_prompt || '',
            ai_interview_prompt: data.ai_interview_prompt || '',
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

  const saveFixedInterviewQuestions = async (jobId: string) => {
    const existingIds = existingFixedQuestions?.map((fq: any) => fq.id) || [];
    const currentIds = fixedInterviewQuestions.filter((q) => q.id).map((q) => q.id!);
    
    // Delete removed questions
    const toDelete = existingIds.filter((id: string) => !currentIds.includes(id));
    for (const fqId of toDelete) {
      await deleteFixedQuestion.mutateAsync({ id: fqId, jobId });
    }

    // Create or update questions
    for (const question of fixedInterviewQuestions) {
      const data = {
        job_id: jobId,
        question_order: question.question_order,
        question_text: question.question_text,
        category: question.category,
        priority: question.priority,
      };

      if (question.id) {
        await updateFixedQuestion.mutateAsync({ id: question.id, ...data });
      } else {
        await createFixedQuestion.mutateAsync(data);
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
        ai_system_prompt: formData.ai_system_prompt || null,
        ai_interview_prompt: formData.ai_interview_prompt || null,
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

      // Save fixed interview questions
      await saveFixedInterviewQuestions(jobId);

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
      <DashboardNavbar user={user} isAdmin={isAdmin} showDashboardLink />

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

              {/* Fixed Interview Questions Section */}
              <FixedInterviewQuestionsEditor
                questions={fixedInterviewQuestions}
                onChange={setFixedInterviewQuestions}
                disabled={isSubmitting}
              />

              {/* AI Interview Questions Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5" />
                    AI Interview Questions Instructions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Define default instructions for how AI should generate personalized interview questions for candidates of this position.
                    These instructions will be pre-filled when generating AI questions for any candidate.
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.ai_interview_prompt}
                    onChange={(e) => setFormData({ ...formData, ai_interview_prompt: e.target.value })}
                    placeholder="Example: Focus on technical problem-solving scenarios. Include questions about team collaboration. Ask about their experience with agile methodologies..."
                    rows={5}
                  />
                </CardContent>
              </Card>

              {/* AI Evaluation Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Evaluation Instructions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Define custom criteria for how AI should evaluate candidates for this position. 
                    These instructions are only visible to recruiters.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <AITemplateSelector
                      onSelect={(template) => {
                        if (template) {
                          setFormData({ ...formData, ai_system_prompt: template.prompt_content });
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setManageTemplatesOpen(true)}
                      className="shrink-0"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Manage Templates
                    </Button>
                  </div>

                  <Textarea
                    value={formData.ai_system_prompt}
                    onChange={(e) => setFormData({ ...formData, ai_system_prompt: e.target.value })}
                    placeholder="Example: Focus on leadership experience and startup background. Pay special attention to communication skills. Prioritize candidates who demonstrate problem-solving abilities in their responses..."
                    rows={6}
                  />

                  {formData.ai_system_prompt.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSaveTemplateOpen(true)}
                    >
                      <SaveAll className="h-4 w-4 mr-2" />
                      Save as Template
                    </Button>
                  )}
                </CardContent>
              </Card>

              <SaveTemplateDialog
                open={saveTemplateOpen}
                onOpenChange={setSaveTemplateOpen}
                promptContent={formData.ai_system_prompt}
              />

              <ManageTemplatesDialog
                open={manageTemplatesOpen}
                onOpenChange={setManageTemplatesOpen}
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