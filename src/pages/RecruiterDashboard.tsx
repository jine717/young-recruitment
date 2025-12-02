import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, FileText, Video, MoreHorizontal, CheckCircle2, Clock, XCircle, Users, Briefcase, ChevronDown, Sparkles, RefreshCw, Settings, Plus, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BulkActionsToolbar } from "@/components/recruiter/BulkActionsToolbar";
import { useBulkActions } from "@/hooks/useBulkActions";
import { useApplications, useUpdateApplicationStatus, type ApplicationWithDetails } from "@/hooks/useApplications";
import { useAIEvaluations, useTriggerAIAnalysis, type AIEvaluation } from "@/hooks/useAIEvaluations";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSendNotification, NotificationType } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { AIScoreBadge } from "@/components/recruiter/AIScoreBadge";
import { AIEvaluationCard } from "@/components/recruiter/AIEvaluationCard";
import { InterviewQuestionsCard } from "@/components/recruiter/InterviewQuestionsCard";
import { NotificationCard } from "@/components/recruiter/NotificationCard";
const statusColors: Record<ApplicationWithDetails['status'], string> = {
  pending: "bg-muted text-muted-foreground",
  under_review: "bg-primary/20 text-primary-foreground",
  interview: "bg-secondary/20 text-secondary-foreground",
  rejected: "bg-destructive/20 text-destructive",
  hired: "bg-green-500/20 text-green-700"
};
const statusLabels: Record<ApplicationWithDetails['status'], string> = {
  pending: "Pending",
  under_review: "Under Review",
  interview: "Interview",
  rejected: "Rejected",
  hired: "Hired"
};
const RecruiterDashboard = () => {
  const {
    data: applications,
    isLoading,
    error
  } = useApplications();
  const { user, hasAccess, isLoading: roleLoading, isAdmin } = useRoleCheck(['recruiter', 'admin']);
  const updateStatus = useUpdateApplicationStatus();
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const triggerAIAnalysis = useTriggerAIAnalysis();
  const sendNotification = useSendNotification();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { isUpdating, bulkUpdateStatus, bulkSendNotification, exportApplications } = useBulkActions();

  const applicationIds = applications?.map(a => a.id) || [];
  const {
    data: aiEvaluations = []
  } = useAIEvaluations(applicationIds);
  const evaluationsMap = new Map<string, AIEvaluation>(aiEvaluations.map(e => [e.application_id, e]));
  const filteredApplications = applications?.filter(app => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (jobFilter !== "all" && app.job_id !== jobFilter) return false;
    return true;
  });
  const uniqueJobs = applications?.reduce((acc, app) => {
    if (app.jobs && !acc.find(j => j.id === app.job_id)) {
      acc.push({
        id: app.job_id,
        title: app.jobs.title
      });
    }
    return acc;
  }, [] as {
    id: string;
    title: string;
  }[]) || [];
  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => a.status === "pending").length || 0,
    underReview: applications?.filter(a => a.status === "under_review").length || 0,
    aiAnalyzed: aiEvaluations.length
  };
  const getNotificationTypeForStatus = (status: ApplicationWithDetails['status']): NotificationType | null => {
    switch (status) {
      case 'interview':
        return 'interview_scheduled';
      case 'hired':
        return 'decision_offer';
      case 'rejected':
        return 'decision_rejection';
      case 'under_review':
        return 'status_update';
      default:
        return null;
    }
  };
  const handleStatusChange = async (applicationId: string, newStatus: ApplicationWithDetails['status']) => {
    try {
      await updateStatus(applicationId, newStatus);
      queryClient.invalidateQueries({
        queryKey: ['applications']
      });

      // Auto-send notification for status change
      const notificationType = getNotificationTypeForStatus(newStatus);
      if (notificationType) {
        sendNotification.mutate({
          applicationId,
          type: notificationType
        });
      }
      toast({
        title: "Status updated",
        description: `Application status changed to ${statusLabels[newStatus]}. Notification sent.`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };
  const handleRetryAI = async (applicationId: string) => {
    try {
      await triggerAIAnalysis.mutateAsync(applicationId);
      toast({
        title: "AI Analysis Started",
        description: "The candidate is being analyzed..."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start AI analysis",
        variant: "destructive"
      });
    }
  };
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredApplications) return;
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const handleBulkStatusChange = async (status: ApplicationWithDetails['status']) => {
    await bulkUpdateStatus(Array.from(selectedIds), status);
    setSelectedIds(new Set());
  };

  const handleBulkNotification = async (type: string) => {
    await bulkSendNotification(Array.from(selectedIds), type);
  };

  const handleExport = () => {
    if (!filteredApplications) return;
    const selectedApps = selectedIds.size > 0
      ? filteredApplications.filter(a => selectedIds.has(a.id))
      : filteredApplications;
    exportApplications(selectedApps);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (roleLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access the dashboard</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>;
  }

  if (!hasAccess) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">You don't have permission to access this dashboard.</p>
            <Button asChild>
              <Link to="/candidate">Go to Candidate Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-3xl tracking-tight">YOUNG RECRUITMENT</Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Open Positions
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-5xl md:text-6xl mb-4">RECRUITER DASHBOARD</h1>
              <p className="text-xl text-muted-foreground">
                Manage applications and track candidates through the hiring process.
              </p>
            </div>
            <Button asChild>
              <Link to="/dashboard/jobs">
                <Plus className="h-4 w-4 mr-2" />
                Manage Jobs
              </Link>
            </Button>
          </div>
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
                  <Sparkles className="h-4 w-4" />
                  AI Analyzed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.aiAnalyzed}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-4 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-4 mb-4">
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
                {uniqueJobs.map(job => <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedIds.size > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedIds.size}
              onClearSelection={() => setSelectedIds(new Set())}
              onStatusChange={handleBulkStatusChange}
              onSendNotification={handleBulkNotification}
              onExport={handleExport}
              isUpdating={isUpdating}
            />
          )}
        </div>
      </section>

      {/* Applications Table */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="p-0">
              {isLoading ? <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div> : error ? <div className="text-center py-20">
                  <p className="text-destructive mb-4">Failed to load applications</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div> : filteredApplications && filteredApplications.length > 0 ? <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={filteredApplications.length > 0 && selectedIds.size === filteredApplications.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[60px]">AI</TableHead>
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
                    {filteredApplications.map(app => {
                  const evaluation = evaluationsMap.get(app.id);
                  const isExpanded = expandedRows.has(app.id);
                  const isSelected = selectedIds.has(app.id);
                  return <Collapsible key={app.id} open={isExpanded} onOpenChange={() => toggleRow(app.id)} asChild>
                          <>
                            <TableRow className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`} onClick={() => evaluation && toggleRow(app.id)}>
                              <TableCell onClick={e => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelection(app.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <AIScoreBadge score={app.ai_score ?? null} status={app.ai_evaluation_status as 'pending' | 'processing' | 'completed' | 'failed' | null} size="sm" />
                                  {evaluation && <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      </Button>
                                    </CollapsibleTrigger>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <Link to={`/dashboard/candidate/${app.id}`} className="font-medium hover:text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                    {app.profiles?.full_name || "Unknown"}
                                  </Link>
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
                                {app.business_case_completed ? <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-sm">Complete</span>
                                  </div> : <div className="flex items-center gap-1 text-muted-foreground">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm">Incomplete</span>
                                  </div>}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {app.cv_url && <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" title="View CV" onClick={e => e.stopPropagation()}>
                                      <FileText className="h-5 w-5" />
                                    </a>}
                                  {app.disc_url && <a href={app.disc_url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-secondary/80" title="View DISC" onClick={e => e.stopPropagation()}>
                                      <FileText className="h-5 w-5" />
                                    </a>}
                                  {app.business_case_completed && <Link to={`/business-case/${app.id}`} className="text-accent hover:text-accent/80" title="View Responses" onClick={e => e.stopPropagation()}>
                                      <Video className="h-5 w-5" />
                                    </Link>}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(app.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/dashboard/candidate/${app.id}`}>
                                        <Users className="h-4 w-4 mr-2" />
                                        View Full Profile
                                      </Link>
                                    </DropdownMenuItem>
                                    {(app.ai_evaluation_status === 'failed' || app.business_case_completed && !app.ai_evaluation_status) && <DropdownMenuItem onClick={() => handleRetryAI(app.id)}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Run AI Analysis
                                      </DropdownMenuItem>}
                                    <DropdownMenuItem onClick={() => handleStatusChange(app.id, "under_review")}>
                                      Mark Under Review
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(app.id, "interview")}>
                                      Move to Interview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(app.id, "hired")}>
                                      Mark as Hired
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(app.id, "rejected")} className="text-destructive">
                                      Reject
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {evaluation && <CollapsibleContent asChild>
                                <TableRow>
                                  <TableCell colSpan={9} className="bg-muted/30 p-0">
                                    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                      <div className="lg:col-span-2 space-y-4">
                                        <AIEvaluationCard evaluation={evaluation} />
                                        <InterviewQuestionsCard applicationId={app.id} />
                                      </div>
                                      <div>
                                        <NotificationCard applicationId={app.id} candidateName={app.profiles?.full_name || "Candidate"} hasBusinessCase={app.business_case_completed} />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>}
                          </>
                        </Collapsible>;
                })}
                  </TableBody>
                </Table> : <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">No applications found</p>
                </div>}
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
    </div>;
};
export default RecruiterDashboard;