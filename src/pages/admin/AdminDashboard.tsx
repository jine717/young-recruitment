import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useUsersWithRoles, useAddUserRole, useRemoveUserRole, useUpdateUserProfile, AppRole, UserWithRole } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, ShieldCheck, UserCheck, Crown, Search, MoreVertical, Pencil, Trash2, Lock } from 'lucide-react';

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
  const updateProfile = useUpdateUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', roles: [] as AppRole[] });
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);

  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditModal = (user: UserWithRole) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.full_name || '',
      roles: [...user.roles]
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      // Update profile name
      await updateProfile.mutateAsync({ 
        userId: editingUser.id, 
        fullName: editForm.fullName 
      });
      
      // Sync roles (add new, remove old)
      const rolesToAdd = editForm.roles.filter(r => !editingUser.roles.includes(r));
      const rolesToRemove = editingUser.roles.filter(r => !editForm.roles.includes(r));
      
      for (const role of rolesToAdd) {
        await addRole.mutateAsync({ userId: editingUser.id, role });
      }
      for (const role of rolesToRemove) {
        await removeRole.mutateAsync({ userId: editingUser.id, role });
      }
      
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    setEditForm(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    // Remove all roles (soft delete - user remains but has no access)
    try {
      for (const role of deletingUser.roles) {
        await removeRole.mutateAsync({ userId: deletingUser.id, role });
      }
      setDeletingUser(null);
    } catch (error) {
      console.error('Failed to remove user roles:', error);
    }
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
                                  className={roleColors[role]}
                                >
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background">
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit user
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletingUser(user)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and roles
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  value={editingUser?.email || ''}
                  disabled
                  className="pr-9 bg-muted/50"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {allRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={editForm.roles.includes(role)}
                      onCheckedChange={(checked) => handleRoleToggle(role, !!checked)}
                    />
                    <label
                      htmlFor={`role-${role}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                    >
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all roles from {deletingUser?.full_name || deletingUser?.email}. 
              They will no longer be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
