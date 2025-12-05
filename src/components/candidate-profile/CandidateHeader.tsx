import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Mail, Calendar, User, CalendarPlus, Trash2, Loader2, TrendingUp, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { InterviewEvaluationForm } from './InterviewEvaluationForm';
import { HiringDecisionModal } from './HiringDecisionModal';

interface CandidateHeaderProps {
  candidateName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  departmentName: string | null;
  applicationDate: string;
  status: string;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
  // AI Score props
  aiScore: number | null;
  aiRecommendation: string | null;
  aiLoading: boolean;
  // Quick Actions props
  applicationId: string;
  onScheduleInterview: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
  under_review: 'bg-blue-500/20 text-blue-700 border-blue-500/50',
  interview: 'bg-purple-500/20 text-purple-700 border-purple-500/50',
  hired: 'bg-green-500/20 text-green-700 border-green-500/50',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/50',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
};

function AIScoreBadge({ 
  score, 
  recommendation, 
  isLoading 
}: { 
  score: number | null; 
  recommendation: string | null; 
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border animate-pulse">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Analyzing...</span>
      </div>
    );
  }

  if (score === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Pending</span>
      </div>
    );
  }

  const getRecommendationConfig = () => {
    switch (recommendation) {
      case 'proceed':
        return {
          icon: TrendingUp,
          bgClass: 'bg-[hsl(var(--young-blue))]/10',
          borderClass: 'border-[hsl(var(--young-blue))]/30',
          textClass: 'text-[hsl(var(--young-blue))]',
        };
      case 'review':
        return {
          icon: AlertTriangle,
          bgClass: 'bg-[hsl(var(--young-gold))]/10',
          borderClass: 'border-[hsl(var(--young-gold))]/30',
          textClass: 'text-[hsl(var(--young-gold))]',
        };
      case 'reject':
        return {
          icon: XCircle,
          bgClass: 'bg-destructive/10',
          borderClass: 'border-destructive/30',
          textClass: 'text-destructive',
        };
      default:
        return {
          icon: TrendingUp,
          bgClass: 'bg-muted/50',
          borderClass: 'border-border',
          textClass: 'text-muted-foreground',
        };
    }
  };

  const config = getRecommendationConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgClass} border ${config.borderClass}`}>
      <span className={`text-lg font-bold ${config.textClass}`}>{score}</span>
      <Icon className={`w-4 h-4 ${config.textClass}`} />
    </div>
  );
}

export function CandidateHeader({
  candidateName,
  email,
  phone,
  jobTitle,
  departmentName,
  applicationDate,
  status,
  onStatusChange,
  isUpdating,
  aiScore,
  aiRecommendation,
  aiLoading,
  applicationId,
  onScheduleInterview,
  onDelete,
  isDeleting,
}: CandidateHeaderProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Top row: Back link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left: Candidate info */}
        <div className="flex-1">
          {/* Name + AI Score inline */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{candidateName}</h1>
            <AIScoreBadge 
              score={aiScore} 
              recommendation={aiRecommendation} 
              isLoading={aiLoading} 
            />
          </div>
          
          <p className="text-muted-foreground mt-1">
            {jobTitle} {departmentName && `• ${departmentName}`}
          </p>

          <div className="flex flex-wrap gap-4 text-sm mt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href={`mailto:${email}`} className="hover:text-primary">
                {email}
              </a>
            </div>
            {phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                {phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Applied {format(new Date(applicationDate), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Right: Status & Quick Actions */}
        <div className="flex flex-col gap-3">
          {/* Status Selector */}
          <Select value={status} onValueChange={onStatusChange} disabled={isUpdating}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={onScheduleInterview} 
              variant="outline" 
              size="sm"
              className="gap-1"
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </Button>
            
            <InterviewEvaluationForm applicationId={applicationId} />
            <HiringDecisionModal applicationId={applicationId} />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this candidate?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The candidate will be permanently removed from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
