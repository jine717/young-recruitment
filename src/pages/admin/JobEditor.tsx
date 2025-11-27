import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import { useJob } from '@/hooks/useJobs';
import { useCreateJob, useUpdateJob, useAllJobs } from '@/hooks/useJobsMutation';
import { useDepartments } from '@/hooks/useDepartments';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
type JobStatus = 'draft' | 'published' | 'closed';

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: departments } = useDepartments();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

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

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing && id) {
      // Fetch job data directly for admin (includes all statuses)
      const fetchJob = async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          navigate('/admin/jobs');
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

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published') => {
    e.preventDefault();

    const jobData = {
      ...formData,
      department_id: formData.department_id || null,
      status: saveAs,
      responsibilities: formData.responsibilities.filter((r) => r.trim()),
      requirements: formData.requirements.filter((r) => r.trim()),
      benefits: formData.benefits.filter((b) => b.trim()),
      tags: formData.tags.filter((t) => t.trim()),
    };

    if (isEditing && id) {
      await updateJob.mutateAsync({ id, ...jobData });
    } else {
      await createJob.mutateAsync(jobData);
    }

    navigate('/admin/jobs');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Job' : 'Create Job'}
            </h2>
            <p className="text-muted-foreground">
              {isEditing ? 'Update job posting details' : 'Create a new job posting'}
            </p>
          </div>
        </div>

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

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/jobs')}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={createJob.isPending || updateJob.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={createJob.isPending || updateJob.isPending}
              >
                {isEditing ? 'Update & Publish' : 'Publish'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
