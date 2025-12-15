import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAllJobs, useDeleteJob, useUpdateJob } from '@/hooks/useJobsMutation';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, Eye, EyeOff, ArrowLeft, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { LinkedInPostModal } from '@/components/recruiter/LinkedInPostModal';
import { format } from 'date-fns';

interface DeleteJobInfo {
  id: string;
  title: string;
  candidateCount: number;
}


export default function RecruiterJobsList() {
  const { user, hasAccess, isLoading: roleLoading, canEdit } = useRoleCheck(['recruiter', 'admin', 'management']);
  const { data: jobs, isLoading } = useAllJobs();
  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<DeleteJobInfo | null>(null);
  const [loadingDeleteInfo, setLoadingDeleteInfo] = useState(false);
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [selectedJobForLinkedIn, setSelectedJobForLinkedIn] = useState<{
    id: string;
    title: string;
    linkedin_post_content?: string | null;
    linkedin_post_status?: string;
  } | null>(null);

  const handleOpenLinkedInModal = (job: any) => {
    setSelectedJobForLinkedIn({
      id: job.id,
      title: job.title,
      linkedin_post_content: job.linkedin_post_content,
      linkedin_post_status: job.linkedin_post_status,
    });
    setLinkedInModalOpen(true);
  };

  const handleDelete = async (job: { id: string; title: string }) => {
    setLoadingDeleteInfo(true);
    setDeleteDialogOpen(true);
    
    // Fetch candidate count for this job
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', job.id);
    
    setJobToDelete({
      id: job.id,
      title: job.title,
      candidateCount: count || 0,
    });
    setLoadingDeleteInfo(false);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteJob.mutate(jobToDelete.id);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const toggleStatus = (job: any) => {
    const newStatus = job.status === 'published' ? 'draft' : 'published';
    updateJob.mutate({
      id: job.id,
      title: job.title,
      location: job.location,
      type: job.type,
      department_id: job.department_id,
      description: job.description,
      responsibilities: job.responsibilities || [],
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      tags: job.tags || [],
      status: newStatus,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLinkedInStatusBadge = (status: string, postedAt?: string | null) => {
    switch (status) {
      case 'posted':
        return (
          <Badge className="bg-[#0077B5] text-white hover:bg-[#006097]">
            <LinkedInIcon className="h-3 w-3 mr-1" />
            Posted
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            <LinkedInIcon className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <LinkedInIcon className="h-3 w-3 mr-1" />
            Not Posted
          </Badge>
        );
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

  if (roleLoading) {
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

  return (
    <DashboardLayout showDashboardLink>

      {/* Header */}
      <section className="pt-32 pb-8 px-6">
        <div className="container mx-auto max-w-7xl">
          <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl mb-2">MANAGE JOBS</h1>
              <p className="text-xl text-muted-foreground">
                Create and manage job postings
              </p>
            </div>
            {canEdit && (
              <Button asChild>
                <Link to="/dashboard/jobs/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Jobs Table */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : jobs && jobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created by</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>LinkedIn</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.departments?.name || '-'}</TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.creator?.email || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(job.created_at), 'dd MMM yyyy, HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>{getLinkedInStatusBadge(job.linkedin_post_status, job.linkedin_posted_at)}</TableCell>
                          <TableCell>
                          {canEdit ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/jobs/${job.id}/edit`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/jobs/${job.id}/business-case`)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Business Case
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatus(job)}>
                                  {job.status === 'published' ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenLinkedInModal(job)}>
                                  <LinkedInIcon className="h-4 w-4 mr-2" />
                                  Post to LinkedIn
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete({ id: job.id, title: job.title })}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/jobs/${job.id}/edit`)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No jobs yet. Create your first job posting.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Vacante
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {loadingDeleteInfo ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando información...
                  </div>
                ) : jobToDelete ? (
                  <>
                    <p>
                      ¿Estás seguro de que deseas eliminar la vacante <strong>"{jobToDelete.title}"</strong>?
                    </p>
                    {jobToDelete.candidateCount > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="text-destructive font-medium">
                          ⚠️ Esta acción eliminará permanentemente:
                        </p>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                          <li><strong>{jobToDelete.candidateCount}</strong> candidato{jobToDelete.candidateCount !== 1 ? 's' : ''} y sus aplicaciones</li>
                          <li>Todos los CVs y evaluaciones DISC</li>
                          <li>Respuestas del Business Case</li>
                          <li>Evaluaciones, entrevistas y notas</li>
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Esta acción no se puede deshacer.
                    </p>
                  </>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loadingDeleteInfo || deleteJob.isPending}
            >
              {deleteJob.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LinkedInPostModal
        open={linkedInModalOpen}
        onOpenChange={setLinkedInModalOpen}
        job={selectedJobForLinkedIn}
      />
    </DashboardLayout>
  );
}
