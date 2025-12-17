import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardNavbarProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  isAdmin?: boolean;
  showDashboardLink?: boolean;
}

export function DashboardNavbar({ user, isAdmin = false, showDashboardLink = false }: DashboardNavbarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="font-display text-xl tracking-tight text-foreground hover:text-young-blue transition-colors duration-200"
        >
          YOUNG RECRUITMENT.
        </Link>
        <div className="flex items-center gap-6">
          {/* Hidden for now - will unhide after new features
          <Link 
            to="/jobs" 
            className="group relative text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Open Positions
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-young-blue transition-all duration-300 group-hover:w-full" />
          </Link>
          */}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="group relative text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Admin Panel
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-young-blue transition-all duration-300 group-hover:w-full" />
            </Link>
          )}
          {showDashboardLink && (
            <Link 
              to="/dashboard" 
              className="group relative text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-young-blue transition-all duration-300 group-hover:w-full" />
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
