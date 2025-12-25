import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, MoreHorizontal, Clock, Users, Briefcase, ChevronDown, Sparkles, RefreshCw, Plus, Trash2, ChevronLeft, ChevronRight, Check, Filter, X, BarChart3, FileCheck, FileQuestion, Eye, Video, CheckCircle, XCircle, UserCircle, Send, Award } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApplications, useUpdateApplicationStatus, useDeleteApplication, type ApplicationWithDetails } from "@/hooks/useApplications";
import { useAIEvaluations, useTriggerAIAnalysis, type AIEvaluation } from "@/hooks/useAIEvaluations";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useRecruiters } from "@/hooks/useRecruiters";
import { useAssignApplication } from "@/hooks/useAssignApplication";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSendNotification, NotificationType } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { AIScoreBadge } from "@/components/recruiter/AIScoreBadge";
import { AIEvaluationCard } from "@/components/recruiter/AIEvaluationCard";
import { AIAssistant } from "@/components/recruiter/AIAssistant";
import { useApplicationsRealtime } from "@/hooks/useApplicationsRealtime";
const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  under_review: "bg-muted text-muted-foreground",
  reviewed: "bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border border-[hsl(var(--young-blue))]/30",
  bcq_sent: "bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border border-[hsl(var(--young-blue))]/30",
  bcq_received: "bg-[hsl(var(--young-blue))]/20 text-[hsl(var(--young-blue))] border border-[hsl(var(--young-blue))]/30",
  pre_interview: "bg-[hsl(var(--young-gold))]/20 text-[hsl(var(--young-gold))] border border-[hsl(var(--young-gold))]/30",
  interview: "bg-muted text-muted-foreground",
  interviewed: "bg-green-500/20 text-green-700 border border-green-500/30",
  evaluated: "bg-purple-500/20 text-purple-700 border border-purple-500/30",
  rejected: "bg-destructive/20 text-destructive border border-destructive/30",
  hired: "bg-green-500/20 text-green-700 border border-green-500/30"
};
const statusLabels: Record<string, string> = {
  pending: "New",
  under_review: "In Review",
  reviewed: "Reviewed",
  bcq_sent: "BCQ Sent",
  bcq_received: "BCQ Received",
  pre_interview: "Pre Interview",
  interview: "Interview",
  interviewed: "Interviewed",
  evaluated: "Evaluated",
  rejected: "Rejected",
  hired: "Hired"
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Sparkles className="h-3 w-3 mr-1" />,
  under_review: <Eye className="h-3 w-3 mr-1" />,
  reviewed: <FileCheck className="h-3 w-3 mr-1" />,
  bcq_sent: <Send className="h-3 w-3 mr-1" />,
  bcq_received: <FileCheck className="h-3 w-3 mr-1" />,
  pre_interview: <FileQuestion className="h-3 w-3 mr-1" />,
  interview: <Video className="h-3 w-3 mr-1" />,
  interviewed: <CheckCircle className="h-3 w-3 mr-1" />,
  evaluated: <Award className="h-3 w-3 mr-1" />,
  rejected: <XCircle className="h-3 w-3 mr-1" />,
  hired: <CheckCircle className="h-3 w-3 mr-1" />
};
const RecruiterDashboard = () => {
  // Enable real-time updates for applications
  useApplicationsRealtime();
  
  const {
    data: applications,
    isLoading,
    error
  } = useApplications();
  const { user, hasAccess, isLoading: roleLoading, isAdmin, isManagement, canEdit } = useRoleCheck(['recruiter', 'admin', 'management']);
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
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Fetch recruiters for assignment dropdown
  const { data: recruiters = [] } = useRecruiters();
  const assignApplication = useAssignApplication();

  const applicationIds = applications?.map(a => a.id) || [];
  const {
    data: aiEvaluations = []
  } = useAIEvaluations(applicationIds);
  const evaluationsMap = new Map<string, AIEvaluation>(aiEvaluations.map(e => [e.application_id, e]));
  const filteredApplications = applications?.filter(app => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (jobFilter !== "all" && app.job_id !== jobFilter) return false;
    
    // Assigned filter
    if (assignedFilter !== "all") {
      if (assignedFilter === "unassigned" && app.assigned_to !== null) return false;
      if (assignedFilter === "me" && app.assigned_to !== user?.id) return false;
      if (assignedFilter !== "unassigned" && assignedFilter !== "me" && app.assigned_to !== assignedFilter) return false;
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const appDate = new Date(app.created_at);
      const now = new Date();
      if (dateFilter === "24h") {
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (appDate < cutoff) return false;
      } else if (dateFilter === "week") {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (appDate < cutoff) return false;
      } else if (dateFilter === "month") {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (appDate < cutoff) return false;
      }
    }
    
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
  
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };
  
  
  const handleAssignedFilterChange = (value: string) => {
    setAssignedFilter(value);
    setCurrentPage(1);
  };
  
  const handleAssignment = (applicationId: string, recruiterId: string | null) => {
    assignApplication.mutate({ applicationId, assignedTo: recruiterId });
  };
  
  const hasActiveFilters = statusFilter !== "all" || jobFilter !== "all" || sortBy !== "date" || dateFilter !== "all" || assignedFilter !== "all";
  
  const clearAllFilters = () => {
    setStatusFilter("all");
    setJobFilter("all");
    setAssignedFilter("all");
    setSortBy("date");
    setDateFilter("all");
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
  return <DashboardLayout>

      {/* Header - compact */}
      <section className="pt-24 pb-6 px-6 bg-background">
        <div className="container mx-auto max-w-7xl">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-3xl md:text-4xl">RECRUITER DASHBOARD</h1>
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Button asChild variant="outline" className="hover-lift">
                <Link to="/dashboard/evaluate">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Candidates Evaluation
                </Link>
              </Button>
              {(isManagement || isAdmin) && (
                <Button asChild variant="outline" className="hover-lift">
                  <Link to="/dashboard/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
              )}
              {(canEdit || isManagement) && (
                <Button asChild variant="outline" className="hover-lift">
                  <Link to="/dashboard/jobs">
                    {canEdit ? (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Manage Jobs
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-4 w-4 mr-2" />
                        View Jobs
                      </>
                    )}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards with brand variants */}
      <section className="pb-8 px-6 pt-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[hsl(var(--young-blue))]/15">
                    <Users className="h-4 w-4 text-[hsl(var(--young-blue))]" />
                  </div>
                  Total Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.05s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[hsl(var(--young-gold))]/15">
                    <Clock className="h-4 w-4 text-[hsl(var(--young-gold))]" />
                  </div>
                  New
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[hsl(var(--young-khaki))]/15">
                    <Briefcase className="h-4 w-4 text-[hsl(var(--young-khaki))]" />
                  </div>
                  Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display">{stats.underReview}</p>
              </CardContent>
            </Card>
            <Card className="shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-500/15">
                    <Sparkles className="h-4 w-4 text-green-600" />
                  </div>
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
              {isLoading ? (
                <div className="py-8 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="shimmer w-8 h-8 rounded-full" />
                      <div className="shimmer w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="shimmer h-4 w-1/3 rounded" />
                        <div className="shimmer h-3 w-1/4 rounded" />
                      </div>
                      <div className="shimmer h-6 w-20 rounded-full" />
                      <div className="shimmer h-4 w-24 rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
                    <X className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-destructive mb-4 font-medium">Failed to load applications</p>
                  <Button variant="outline" onClick={() => window.location.reload()} className="hover-lift">
                    Retry
                  </Button>
                </div>
              ) : paginatedApplications && paginatedApplications.length > 0 ? <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary cursor-pointer font-medium">
                              AI
                              <ChevronDown className="h-3 w-3" />
                              {sortBy !== "date" && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  <Filter className="h-3 w-3" />
                                </Badge>
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleSortChange("date")} className="flex items-center justify-between">
                                Default (by Date)
                                {sortBy === "date" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSortChange("ai_score_desc")} className="flex items-center justify-between">
                                Best to Worst
                                {sortBy === "ai_score_desc" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSortChange("ai_score_asc")} className="flex items-center justify-between">
                                Worst to Best
                                {sortBy === "ai_score_asc" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
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
                              {/* Initial phase */}
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("pending")} className="flex items-center justify-between">
                                New
                                {statusFilter === "pending" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("under_review")} className="flex items-center justify-between">
                                In Review
                                {statusFilter === "under_review" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("reviewed")} className="flex items-center justify-between">
                                Reviewed
                                {statusFilter === "reviewed" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* BCQ phase */}
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("bcq_sent")} className="flex items-center justify-between">
                                BCQ Sent
                                {statusFilter === "bcq_sent" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("bcq_received")} className="flex items-center justify-between">
                                BCQ Received
                                {statusFilter === "bcq_received" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Interview phase */}
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("pre_interview")} className="flex items-center justify-between">
                                Pre Interview
                                {statusFilter === "pre_interview" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("interview")} className="flex items-center justify-between">
                                Interview
                                {statusFilter === "interview" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("interviewed")} className="flex items-center justify-between">
                                Interviewed
                                {statusFilter === "interviewed" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Final phase */}
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("evaluated")} className="flex items-center justify-between">
                                Evaluated
                                {statusFilter === "evaluated" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("hired")} className="flex items-center justify-between">
                                Hired
                                {statusFilter === "hired" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusFilterChange("rejected")} className="flex items-center justify-between">
                                Rejected
                                {statusFilter === "rejected" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                        <TableHead>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary cursor-pointer font-medium">
                              Assigned
                              <ChevronDown className="h-3 w-3" />
                              {assignedFilter !== "all" && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  <Filter className="h-3 w-3" />
                                </Badge>
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleAssignedFilterChange("all")} className="flex items-center justify-between">
                                All
                                {assignedFilter === "all" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAssignedFilterChange("me")} className="flex items-center justify-between">
                                Assigned to Me
                                {assignedFilter === "me" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignedFilterChange("unassigned")} className="flex items-center justify-between">
                                Unassigned
                                {assignedFilter === "unassigned" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              {recruiters.length > 0 && <DropdownMenuSeparator />}
                              {recruiters.map(recruiter => (
                                <DropdownMenuItem 
                                  key={recruiter.id} 
                                  onClick={() => handleAssignedFilterChange(recruiter.id)} 
                                  className="flex items-center justify-between"
                                >
                                  {recruiter.full_name || recruiter.email || 'Unknown'}
                                  {assignedFilter === recruiter.id && <Check className="h-4 w-4 ml-2" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                        <TableHead>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary cursor-pointer font-medium">
                              Applied
                              <ChevronDown className="h-3 w-3" />
                              {dateFilter !== "all" && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  <Filter className="h-3 w-3" />
                                </Badge>
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleDateFilterChange("all")} className="flex items-center justify-between">
                                All Time
                                {dateFilter === "all" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDateFilterChange("24h")} className="flex items-center justify-between">
                                Last 24 Hours
                                {dateFilter === "24h" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDateFilterChange("week")} className="flex items-center justify-between">
                                Last Week
                                {dateFilter === "week" && <Check className="h-4 w-4 ml-2" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDateFilterChange("month")} className="flex items-center justify-between">
                                Last Month
                                {dateFilter === "month" && <Check className="h-4 w-4 ml-2" />}
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
                  return <Collapsible key={app.id} open={isExpanded} onOpenChange={() => toggleRow(app.id)} asChild>
                          <>
                            <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => evaluation && toggleRow(app.id)}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <AIScoreBadge 
                                    score={app.ai_score ?? null} 
                                    status={app.ai_evaluation_status as 'pending' | 'processing' | 'completed' | 'failed' | null} 
                                    size="sm"
                                    initialScore={evaluation?.initial_overall_score ?? null}
                                    evaluationStage={evaluation?.evaluation_stage ?? null}
                                  />
                                  {evaluation && <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      </Button>
                                    </CollapsibleTrigger>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <Link to={`/dashboard/candidate/${app.id}`} className="font-medium hover:text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                      {app.candidate_name || app.profiles?.full_name || "Unknown"}
                                    </Link>
                                    {app.bcq_delayed && (
                                      <Badge className="bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 h-5">
                                        D
                                      </Badge>
                                    )}
                                  </div>
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
                                  {statusIcons[app.status]}
                                  {statusLabels[app.status]}
                                </Badge>
                              </TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {canEdit ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                                        {app.assigned_recruiter ? (
                                          <>
                                            <UserCircle className="h-3 w-3" />
                                            {app.assigned_recruiter.full_name || app.assigned_recruiter.email?.split('@')[0] || 'Assigned'}
                                          </>
                                        ) : (
                                          <span className="text-muted-foreground">Unassigned</span>
                                        )}
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="bg-popover">
                                      <DropdownMenuItem 
                                        onClick={() => handleAssignment(app.id, null)}
                                        className="flex items-center justify-between"
                                      >
                                        Unassigned
                                        {!app.assigned_to && <Check className="h-4 w-4 ml-2" />}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {recruiters.map(recruiter => (
                                        <DropdownMenuItem 
                                          key={recruiter.id} 
                                          onClick={() => handleAssignment(app.id, recruiter.id)}
                                          className="flex items-center justify-between"
                                        >
                                          {recruiter.full_name || recruiter.email || 'Unknown'}
                                          {app.assigned_to === recruiter.id && <Check className="h-4 w-4 ml-2" />}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {app.assigned_recruiter?.full_name || app.assigned_recruiter?.email?.split('@')[0] || 'Unassigned'}
                                  </span>
                                )}
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
                                    {canEdit && (
                                      <DropdownMenuItem onClick={() => setDeleteConfirmId(app.id)} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {evaluation && <CollapsibleContent asChild>
                                <TableRow>
                                  <TableCell colSpan={9} className="bg-muted/30 p-0">
                                    <div className="p-4">
                                      <AIEvaluationCard evaluation={evaluation} />
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

      {/* AI Assistant - temporarily hidden
      {canEdit && <AIAssistant />}
      */}
    </DashboardLayout>;
};
export default RecruiterDashboard;