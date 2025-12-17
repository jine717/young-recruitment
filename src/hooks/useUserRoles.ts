import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'recruiter' | 'admin' | 'management';

export interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: AppRole[];
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles: roles
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole),
      }));

      return usersWithRoles;
    },
  });
}

export function useAddUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'Role added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add role', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'Role removed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to remove role', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'User profile updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      fullName: string;
      password?: string;
      sendInvite: boolean;
      roles: AppRole[];
    }) => {
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: data
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ 
        title: 'User created',
        description: variables.sendInvite 
          ? `Invitation sent to ${variables.email}`
          : `User ${variables.email} created successfully`
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create user', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
