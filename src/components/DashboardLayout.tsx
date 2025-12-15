import { ReactNode } from 'react';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  showDashboardLink?: boolean;
}

export function DashboardLayout({ children, showDashboardLink = false }: DashboardLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRoleCheck(['recruiter', 'admin', 'management']);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNavbar user={user} isAdmin={isAdmin} showDashboardLink={showDashboardLink} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
