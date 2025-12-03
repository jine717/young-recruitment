import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, MoreHorizontal, Clock, Users, Briefcase, ChevronDown, Sparkles, RefreshCw, Plus, Trash2, ChevronLeft, ChevronRight, Check, Filter, X } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { BulkActionsToolbar } from "@/components/recruiter/BulkActionsToolbar";
import { useBulkActions } from "@/hooks/useBulkActions";
import { useApplications, useUpdateApplicationStatus, useDeleteApplication, type ApplicationWithDetails } from "@/hooks/useApplications";
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
  const deleteApplication = useDeleteApplication();
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const triggerAIAnalysis = useTriggerAIAnalysis();
  const sendNotification = useSendNotification();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  })?.sort((a, b) => {
    if (sortBy === "ai_score_desc") {
      return (b.ai_score ?? -1) - (a.ai_score ?? -1);
    }
    if (sortBy === "ai_score_asc") {
      return (a.ai_score ?? -1) - (b.ai_score ?? -1);
    }
    // Default: sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Pagination calculations
  const totalItems = filteredApplications?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedApplications = filteredApplications?.slice(startIndex, endIndex);

  // Reset page when filters change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  const handleJobFilterChange = (value: string) => {
    setJobFilter(value);
    setCurrentPage(1);
  };
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };
  
  const hasActiveFilters = statusFilter !== "all" || jobFilter !== "all" || sortBy !== "date";
  
  const clearAllFilters = () => {
    setStatusFilter("all");
    setJobFilter("all");
    setSortBy("date");
    setCurrentPage(1);
  };
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
  const handleDelete = async (applicationId: string) => {
    try {
      await deleteApplication(applicationId);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Candidate deleted",
        description: "The candidate has been removed from the system."
      });
      setDeleteConfirmId(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete candidate",
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
      <DashboardNavbar user={user} isAdmin={isAdmin} />

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


      {/* Applications Table */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <Card>
            <CardContent className="p-0">
              {selectedIds.size > 0 && (
                <div className="p-4 border-b">
                  <BulkActionsToolbar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onStatusChange={handleBulkStatusChange}
                    onSendNotification={handleBulkNotification}
                    onExport={handleExport}
                    isUpdating={isUpdating}
                  />
                </div>
              )}
              {isLoading ? <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div> : error ? <div className="text-center py-20">
                  <p className="text-destructive mb-4">Failed to load applications</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div> : paginatedApplications && paginatedApplications.length > 0 ? <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={paginatedApplications.length > 0 && paginatedApplications.every(a => selectedIds.has(a.id))}
                            onCheckedChange={() => {
                              const pageIds = paginatedApplications.map(a => a.id);
                              const allSelected = pageIds.every(id => selectedIds.has(id));
                              if (allSelected) {
                                setSelectedIds(prev => {
                                  const newSet = new Set(prev);
                                  pageIds.forEach(id => newSet.delete(id));
                                  return newSet;
                                });
                              } else {
                                setSelectedIds(prev => new Set([...prev, ...pageIds]));
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="w-[60px]">AI</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary cursor-pointer font-medium">
                              Position
                              <ChevronDown className="h-3 w-3" />
                              {jobFilter !== "all" && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  <Filter className="h-3 w-3" />
                                </Badge>
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleJobFilterChange("all")} className="flex items-center justify-between">
                                All Jobs
                                {jobFilter === "all" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {uniqueJobs.map(job => (
                                <DropdownMenuItem key={job.id} onClick={() => handleJobFilterChange(job.id)} className="flex items-center justify-between">
                                  {job.title}
                                  {jobFilter === job.id && <Check className="h-4 w-4 ml-2" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                        <TableHead>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary cursor-pointer font-medium">
                              Status
                              <ChevronDown className="h-3 w-3" />
                              {statusFilter !== "all" && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  <Filter className="h-3 w-3" />
                                </Badge>
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("all")} className="flex items-center justify-between">
                                All Statuses
                                {statusFilter === "all" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("pending")} className="flex items-center justify-between">
                                Pending
                                {statusFilter === "pending" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("under_review")} className="flex items-center justify-between">
                                Under Review
                                {statusFilter === "under_review" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("interview")} className="flex items-center justify-between">
                                Interview
                                {statusFilter === "interview" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("rejected")} className="flex items-center justify-between">
                                Rejected
                                {statusFilter === "rejected" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("hired")} className="flex items-center justify-between">
                                Hired
                                {statusFilter === "hired" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                        <TableHead>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary cursor-pointer font-medium">
                              Applied
                              <ChevronDown className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleSortChange("date")} className="flex items-center justify-between">
                                Newest First
                                {sortBy === "date" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSortChange("ai_score_desc")} className="flex items-center justify-between">
                                AI Score (High to Low)
                                {sortBy === "ai_score_desc" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSortChange("ai_score_asc")} className="flex items-center justify-between">
                                AI Score (Low to High)
                                {sortBy === "ai_score_asc" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                        <TableHead className="w-[50px]">
                          {hasActiveFilters && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllFilters}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              title="Clear all filters"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear
                            </Button>
                          )}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedApplications.map(app => {
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
                                    {app.candidate_name || app.profiles?.full_name || "Unknown"}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{app.candidate_email || app.profiles?.email}</p>
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
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(app.created_at), "MMM d, yyyy 'at' HH:mm")}
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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setDeleteConfirmId(app.id)} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {evaluation && <CollapsibleContent asChild>
                                <TableRow>
                                  <TableCell colSpan={7} className="bg-muted/30 p-0">
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
                  </Table>
                  
                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Per page:</span>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                          <SelectTrigger className="w-[70px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => 
                              page === 1 || 
                              page === totalPages || 
                              Math.abs(page - currentPage) <= 1
                            )
                            .map((page, idx, arr) => (
                              <span key={page}>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span className="px-2 text-muted-foreground">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </Button>
                              </span>
                            ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </> : <div className="text-center py-20">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The candidate will be permanently removed from the system. No notification will be sent to the candidate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default RecruiterDashboard;