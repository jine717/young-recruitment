import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Mail, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
}: CandidateHeaderProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div>
            <h1 className="text-2xl font-bold">{candidateName}</h1>
            <p className="text-muted-foreground mt-1">
              {jobTitle} {departmentName && `• ${departmentName}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
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

        <div className="flex items-center gap-4">
          <Badge className={statusColors[status]}>
            {statusLabels[status] || status}
          </Badge>

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
        </div>
      </div>
    </div>
  );
}
