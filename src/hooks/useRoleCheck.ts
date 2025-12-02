import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'candidate' | 'recruiter' | 'admin';

interface RoleCheckResult {
  user: ReturnType<typeof useAuth>['user'];
  hasAccess: boolean | null;
  isLoading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isRecruiter: boolean;
}

export function useRoleCheck(allowedRoles: AppRole[]): RoleCheckResult {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkRoles() {
      if (!user) {
        setHasAccess(false);
        setRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', allowedRoles);

        const userRoles = (data?.map(r => r.role) || []) as AppRole[];
        setRoles(userRoles);
        setHasAccess(userRoles.length > 0);
      } catch (error) {
        console.error('Error checking roles:', error);
        setHasAccess(false);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    checkRoles();
  }, [user, allowedRoles.join(',')]);

  return {
    user,
    hasAccess,
    isLoading,
    roles,
    isAdmin: roles.includes('admin'),
    isRecruiter: roles.includes('recruiter'),
  };
}
