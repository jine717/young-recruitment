import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Video, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Briefcase
} from "lucide-react";
import { useApplications, useUpdateApplicationStatus, type ApplicationWithDetails } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<ApplicationWithDetails['status'], string> = {
  pending: "bg-muted text-muted-foreground",
  under_review: "bg-primary/20 text-primary-foreground",
  interview: "bg-secondary/20 text-secondary-foreground",
  rejected: "bg-destructive/20 text-destructive",
  hired: "bg-green-500/20 text-green-700",
};

const statusLabels: Record<ApplicationWithDetails['status'], string> = {
  pending: "Pending",
  under_review: "Under Review",
  interview: "Interview",
  rejected: "Rejected",
  hired: "Hired",
};

const RecruiterDashboard = () => {
  const { data: applications, isLoading, error } = useApplications();
  const { user } = useAuth();
  const updateStatus = useUpdateApplicationStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");

  const filteredApplications = applications?.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (jobFilter !== "all" && app.job_id !== jobFilter) return false;
    return true;
  });

  const uniqueJobs = applications?.reduce((acc, app) => {
    if (app.jobs && !acc.find((j) => j.id === app.job_id)) {
      acc.push({ id: app.job_id, title: app.jobs.title });
    }
    return acc;
  }, [] as { id: string; title: string }[]) || [];

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a) => a.status === "pending").length || 0,
    underReview: applications?.filter((a) => a.status === "under_review").length || 0,
    businessCaseComplete: applications?.filter((a) => a.business_case_completed).length || 0,
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationWithDetails['status']) => {
    try {
      await updateStatus(applicationId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Status updated",
        description: `Application status changed to ${statusLabels[newStatus]}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access the dashboard</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
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
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Open Positions
            </Link>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-8 px-6">
        <div className="container mx-auto max-w-7xl">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="font-display text-5xl md:text-6xl mb-4">RECRUITER DASHBOARD</h1>
          <p className="text-xl text-muted-foreground">
            Manage applications and track candidates through the hiring process.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="pb-8 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Under Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.underReview}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Business Case Done
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.businessCaseComplete}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-4 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {uniqueJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Applications Table */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-destructive mb-4">Failed to load applications</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : filteredApplications && filteredApplications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Business Case</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.profiles?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{app.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.jobs?.title || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {app.jobs?.departments?.name || "General"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[app.status]}>
                            {statusLabels[app.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {app.business_case_completed ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm">Complete</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Incomplete</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {app.cv_url && (
                              <a
                                href={app.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                                title="View CV"
                              >
                                <FileText className="h-5 w-5" />
                              </a>
                            )}
                            {app.disc_url && (
                              <a
                                href={app.disc_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary hover:text-secondary/80"
                                title="View DISC"
                              >
                                <FileText className="h-5 w-5" />
                              </a>
                            )}
                            {app.business_case_completed && (
                              <Link
                                to={`/business-case/${app.id}`}
                                className="text-accent hover:text-accent/80"
                                title="View Responses"
                              >
                                <Video className="h-5 w-5" />
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(app.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(app.id, "under_review")}>
                                Mark Under Review
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(app.id, "interview")}>
                                Move to Interview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(app.id, "hired")}>
                                Mark as Hired
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(app.id, "rejected")}
                                className="text-destructive"
                              >
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">No applications found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-2xl">YOUNG.</p>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Young. Unite to Disrupt.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RecruiterDashboard;
