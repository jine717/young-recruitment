import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useUsersWithRoles, useAddUserRole, useRemoveUserRole, AppRole } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, ShieldCheck, UserCheck, Crown, Search, Plus, X } from 'lucide-react';

const roleColors: Record<AppRole, string> = {
  recruiter: 'bg-[hsl(var(--young-blue))]/15 text-[hsl(var(--young-blue))] border-[hsl(var(--young-blue))]/30',
  admin: 'bg-destructive/15 text-destructive border-destructive/30',
  management: 'bg-[hsl(var(--young-gold))]/15 text-[hsl(var(--young-gold))] border-[hsl(var(--young-gold))]/30',
};

const allRoles: AppRole[] = ['recruiter', 'admin', 'management'];

export default function AdminDashboard() {
  const { data: users, isLoading } = useUsersWithRoles();
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRole = (userId: string, role: AppRole) => {
    addRole.mutate({ userId, role });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    removeRole.mutate({ userId, role });
  };

  const getAvailableRoles = (userRoles: AppRole[]) => {
    return allRoles.filter(role => !userRoles.includes(role));
  };

  // Calculate stats
  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.roles.includes('admin')).length || 0;
  const recruiterCount = users?.filter(u => u.roles.includes('recruiter')).length || 0;
  const managementCount = users?.filter(u => u.roles.includes('management')).length || 0;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      colorClass: 'bg-[hsl(var(--young-blue))]/15 text-[hsl(var(--young-blue))]',
    },
    {
      title: 'Admins',
      value: adminCount,
      icon: ShieldCheck,
      colorClass: 'bg-destructive/15 text-destructive',
    },
    {
      title: 'Recruiters',
      value: recruiterCount,
      icon: UserCheck,
      colorClass: 'bg-[hsl(var(--young-blue))]/15 text-[hsl(var(--young-blue))]',
    },
    {
      title: 'Management',
      value: managementCount,
      icon: Crown,
      colorClass: 'bg-[hsl(var(--young-gold))]/15 text-[hsl(var(--young-gold))]',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            ADMIN PANEL
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users and roles
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="shadow-young-sm hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.colorClass}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        <Card className="shadow-young-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={`${roleColors[role]} flex items-center gap-1`}
                                >
                                  {role}
                                  <button
                                    onClick={() => handleRemoveRole(user.id, role)}
                                    className="ml-0.5 hover:opacity-70 transition-opacity"
                                    title={`Remove ${role} role`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {getAvailableRoles(user.roles).length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Role
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {getAvailableRoles(user.roles).map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleAddRole(user.id, role)}
                                  >
                                    Add {role}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
