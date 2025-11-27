import { Link } from 'react-router-dom';
import { CandidateLayout } from '@/components/candidate-portal/CandidateLayout';
import { ApplicationCard } from '@/components/candidate-portal/ApplicationCard';
import { useCandidateApplications } from '@/hooks/useCandidateApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react';

export default function CandidateDashboard() {
  const { data: applications, isLoading } = useCandidateApplications();

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => ['pending', 'under_review'].includes(a.status)).length || 0,
    inProgress: applications?.filter(a => a.status === 'interview').length || 0,
    completed: applications?.filter(a => ['hired', 'rejected'].includes(a.status)).length || 0,
  };

  return (
    <CandidateLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your journey by applying to open positions
              </p>
              <Button asChild>
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </CandidateLayout>
  );
}
