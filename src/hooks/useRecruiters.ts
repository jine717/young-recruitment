import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Recruiter {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function useRecruiters() {
  return useQuery({
    queryKey: ['recruiters'],
    queryFn: async () => {
      // Get all users with recruiter or admin roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['recruiter', 'admin']);

      if (rolesError) throw rolesError;

      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) return [];

      // Get profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      return (profilesData || []) as Recruiter[];
    },
  });
}
