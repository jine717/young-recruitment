import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  variant?: "full" | "simple";
}

const Navbar = ({ variant = "simple" }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      setIsAdmin(data && data.length > 0);
    };

    checkAdminRole();
  }, [user]);

  const goToDashboard = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = data?.map(r => r.role) || [];

    if (roles.includes('admin')) {
      navigate('/admin');
    } else if (roles.includes('recruiter')) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="font-display text-xl tracking-tight text-foreground hover:text-young-blue transition-colors duration-200"
        >
          YOUNG RECRUITMENT.
        </Link>
        
        {variant === "full" && (
          <div className="flex items-center gap-6">
            {user ? (
              <>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="group relative text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Admin Panel
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-young-blue transition-all duration-300 group-hover:w-full" />
                  </Link>
                )}
                <Link 
                  to="/dashboard" 
                  className="group relative text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-young-blue transition-all duration-300 group-hover:w-full" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {user.user_metadata?.full_name || 'My Account'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover">
                    <DropdownMenuItem onClick={goToDashboard} className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="ghost" asChild>
                <Link to="/auth">Recruiter Login</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
