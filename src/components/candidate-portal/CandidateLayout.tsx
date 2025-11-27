import { ReactNode, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, FileText, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/candidate', label: 'My Applications', icon: FileText },
];

export function CandidateLayout({ children }: CandidateLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="font-bold text-xl text-foreground">
                Young
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      asChild
                    >
                      <Link to={item.href} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/jobs" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Browse Jobs
                  </Link>
                </Button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
