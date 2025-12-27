import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAllJobs, useDeleteJob, useUpdateJob, useDuplicateJob } from '@/hooks/useJobsMutation';
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, Eye, EyeOff, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function JobsList() {
  const { data: jobs, isLoading } = useAllJobs();
  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();
  const duplicateJob = useDuplicateJob();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setJobToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteJob.mutate(jobToDelete);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Jobs</h2>
            <p className="text-muted-foreground">Manage job postings</p>
          </div>
          <Button asChild>
            <Link to="/admin/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : jobs && jobs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.departments?.name || '-'}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell className="capitalize">{job.type}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => duplicateJob.mutate(job.id)}
                              disabled={duplicateJob.isPending}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/jobs/${job.id}/business-case`)}>
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
                            <DropdownMenuItem
                              onClick={() => handleDelete(job.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this job? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
