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
import { ArrowLeft, Mail, Calendar, User, Trash2, Loader2, TrendingUp, AlertTriangle, XCircle, Clock, Sparkles, Eye, Video, CheckCircle, FileCheck } from 'lucide-react';
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
  // Pre/Post interview differentiation
  initialScore: number | null;
  evaluationStage: 'initial' | 'post_interview' | null;
  // Quick Actions props
  applicationId: string;
  onDelete: () => void;
  isDeleting: boolean;
  // Editing permission
  canEdit?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  under_review: 'bg-muted text-muted-foreground',
  reviewed: 'bg-[hsl(var(--young-khaki))]/20 text-[hsl(var(--young-khaki))] border-[hsl(var(--young-khaki))]/50',
  interview: 'bg-muted text-muted-foreground',
  interviewed: 'bg-green-500/20 text-green-700 border-green-500/50',
  hired: 'bg-green-500/20 text-green-700 border-green-500/50',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/50',
};

const statusLabels: Record<string, string> = {
  pending: 'New',
  under_review: 'In Review',
  reviewed: 'Reviewed',
  interview: 'Interview',
  interviewed: 'Interviewed',
  hired: 'Hired',
  rejected: 'Rejected',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Sparkles className="h-3 w-3 mr-1" />,
  under_review: <Eye className="h-3 w-3 mr-1" />,
  reviewed: <FileCheck className="h-3 w-3 mr-1" />,
  interview: <Video className="h-3 w-3 mr-1" />,
  interviewed: <CheckCircle className="h-3 w-3 mr-1" />,
  hired: <CheckCircle className="h-3 w-3 mr-1" />,
  rejected: <XCircle className="h-3 w-3 mr-1" />,
};

function AIScoreBadge({ 
  score, 
  recommendation, 
  isLoading,
  initialScore,
  evaluationStage
}: { 
  score: number | null; 
  recommendation: string | null; 
  isLoading: boolean;
  initialScore: number | null;
  evaluationStage: 'initial' | 'post_interview' | null;
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

  // Check if this is post-interview score
  const isPostInterview = evaluationStage === 'post_interview';
  const scoreChange = isPostInterview && initialScore !== null ? score - initialScore : null;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgClass} border ${config.borderClass}`}>
        {isPostInterview && initialScore !== null ? (
          <>
            <span className="text-sm text-muted-foreground line-through">{initialScore}</span>
            <span className="text-muted-foreground">→</span>
            <span className={`text-lg font-bold ${config.textClass}`}>{score}</span>
            {scoreChange !== null && scoreChange !== 0 && (
              <span className={`text-xs font-medium ${scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({scoreChange > 0 ? '+' : ''}{scoreChange})
              </span>
            )}
          </>
        ) : (
          <span className={`text-lg font-bold ${config.textClass}`}>{score}</span>
        )}
        <Icon className={`w-4 h-4 ${config.textClass}`} />
      </div>
      {isPostInterview && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--young-blue))]/10 text-[hsl(var(--young-blue))] border border-[hsl(var(--young-blue))]/20">
          Post-Interview
        </span>
      )}
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
  initialScore,
  evaluationStage,
  applicationId,
  onDelete,
  isDeleting,
  canEdit = true,
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
              initialScore={initialScore}
              evaluationStage={evaluationStage}
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
          {/* Status Selector - only editable for recruiters/admins */}
          {canEdit ? (
            <Select value={status} onValueChange={onStatusChange} disabled={isUpdating}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <span className="flex items-center">
                    {statusIcons[status]}
                    {statusLabels[status] || status}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <span className="flex items-center">{statusIcons.pending} New</span>
                </SelectItem>
                <SelectItem value="under_review">
                  <span className="flex items-center">{statusIcons.under_review} In Review</span>
                </SelectItem>
                <SelectItem value="reviewed">
                  <span className="flex items-center">{statusIcons.reviewed} Reviewed</span>
                </SelectItem>
                <SelectItem value="interview">
                  <span className="flex items-center">{statusIcons.interview} Interview</span>
                </SelectItem>
                <SelectItem value="interviewed">
                  <span className="flex items-center text-green-700">{statusIcons.interviewed} Interviewed</span>
                </SelectItem>
                <SelectItem value="hired">
                  <span className="flex items-center text-green-700">{statusIcons.hired} Hired</span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center text-destructive">{statusIcons.rejected} Rejected</span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${statusColors[status] || 'bg-muted'}`}>
              {statusIcons[status]}
              <span className="font-medium">{statusLabels[status] || status}</span>
            </div>
          )}

          {/* Quick Actions - only for recruiters/admins */}
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
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
          )}
        </div>
      </div>
    </div>
  );
}
