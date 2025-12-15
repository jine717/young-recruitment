import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'candidate' | 'recruiter' | 'admin' | 'management';

interface RoleCheckResult {
  user: ReturnType<typeof useAuth>['user'];
  hasAccess: boolean | null;
  isLoading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isRecruiter: boolean;
  isManagement: boolean;
  canEdit: boolean;
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

  const isAdmin = roles.includes('admin');
  const isRecruiter = roles.includes('recruiter');
  const isManagement = roles.includes('management');
  
  // canEdit is true only for recruiters and admins, NOT for management
  const canEdit = isAdmin || isRecruiter;

  return {
    user,
    hasAccess,
    isLoading,
    roles,
    isAdmin,
    isRecruiter,
    isManagement,
    canEdit,
  };
}
