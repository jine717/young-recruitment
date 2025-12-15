import { useRoleCheck } from '@/hooks/useRoleCheck';

/**
 * Hook to check if the current user can edit/modify data.
 * Returns true for recruiters and admins, false for management and other roles.
 */
export function useCanEdit(): boolean {
  const { canEdit } = useRoleCheck(['recruiter', 'admin', 'management']);
  return canEdit;
}
