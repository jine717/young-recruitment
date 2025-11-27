import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllJobs } from '@/hooks/useJobsMutation';
import { useDepartments } from '@/hooks/useDepartments';
import { useUsersWithRoles } from '@/hooks/useUserRoles';
import { Briefcase, Building2, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: jobs, isLoading: jobsLoading } = useAllJobs();
  const { data: departments, isLoading: deptsLoading } = useDepartments();
  const { data: users, isLoading: usersLoading } = useUsersWithRoles();

  const publishedJobs = jobs?.filter((j) => j.status === 'published').length || 0;
  const draftJobs = jobs?.filter((j) => j.status === 'draft').length || 0;
  const adminCount = users?.filter((u) => u.roles.includes('admin')).length || 0;
  const recruiterCount = users?.filter((u) => u.roles.includes('recruiter')).length || 0;

  const stats = [
    {
      title: 'Total Jobs',
      value: jobsLoading ? '...' : jobs?.length || 0,
      subtitle: `${publishedJobs} published, ${draftJobs} draft`,
      icon: Briefcase,
      href: '/admin/jobs',
    },
    {
      title: 'Departments',
      value: deptsLoading ? '...' : departments?.length || 0,
      subtitle: 'Active departments',
      icon: Building2,
      href: '/admin/departments',
    },
    {
      title: 'Users',
      value: usersLoading ? '...' : users?.length || 0,
      subtitle: `${adminCount} admins, ${recruiterCount} recruiters`,
      icon: Users,
      href: '/admin/users',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage your recruitment platform</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                to="/admin/jobs/new"
                className="block p-3 rounded-md bg-accent hover:bg-accent/80 transition-colors"
              >
                <div className="font-medium">Create New Job</div>
                <div className="text-sm text-muted-foreground">
                  Add a new job posting to the platform
                </div>
              </Link>
              <Link
                to="/admin/departments"
                className="block p-3 rounded-md bg-accent hover:bg-accent/80 transition-colors"
              >
                <div className="font-medium">Manage Departments</div>
                <div className="text-sm text-muted-foreground">
                  Add or edit department categories
                </div>
              </Link>
              <Link
                to="/admin/users"
                className="block p-3 rounded-md bg-accent hover:bg-accent/80 transition-colors"
              >
                <div className="font-medium">Manage User Roles</div>
                <div className="text-sm text-muted-foreground">
                  Assign admin or recruiter roles to users
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : jobs && jobs.length > 0 ? (
                <ul className="space-y-2">
                  {jobs.slice(0, 5).map((job) => (
                    <li key={job.id}>
                      <Link
                        to={`/admin/jobs/${job.id}/edit`}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <span className="font-medium">{job.title}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            job.status === 'published'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : job.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {job.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No jobs yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
