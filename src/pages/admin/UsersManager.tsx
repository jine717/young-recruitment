import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUsersWithRoles, useAddUserRole, useRemoveUserRole } from '@/hooks/useUserRoles';
import { Search, Plus, X } from 'lucide-react';

type AppRole = 'candidate' | 'recruiter' | 'admin';

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  recruiter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  candidate: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const allRoles: AppRole[] = ['admin', 'recruiter', 'candidate'];

export default function UsersManager() {
  const { data: users, isLoading } = useUsersWithRoles();
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    );
  });

  const handleAddRole = (userId: string, role: AppRole) => {
    addRole.mutate({ userId, role });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    removeRole.mutate({ userId, role });
  };

  const getAvailableRoles = (currentRoles: AppRole[]): AppRole[] => {
    return allRoles.filter((role) => !currentRoles.includes(role));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                className={`${roleColors[role]} flex items-center gap-1`}
                              >
                                {role}
                                <button
                                  onClick={() => handleRemoveRole(user.id, role)}
                                  className="hover:bg-black/10 rounded-full p-0.5"
                                  disabled={removeRole.isPending}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAvailableRoles(user.roles).length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Role
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
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
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
