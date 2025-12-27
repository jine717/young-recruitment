import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, LayoutDashboard, Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavbarProps {
  variant?: "full" | "simple";
}

const Navbar = ({ variant = "simple" }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="font-display text-lg md:text-xl tracking-tight text-foreground hover:text-young-blue transition-colors duration-200"
        >
          YOUNG RECRUITMENT.
        </Link>
        
        {variant === "full" && user && (
          <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
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
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background">
                  <SheetHeader className="border-b border-border pb-4 mb-4">
                    <SheetTitle className="text-left font-display">
                      {user.user_metadata?.full_name || 'My Account'}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="justify-start h-12 text-base"
                      onClick={() => handleNavClick('/dashboard')}
                    >
                      <LayoutDashboard className="h-5 w-5 mr-3" />
                      Dashboard
                    </Button>
                    
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        className="justify-start h-12 text-base"
                        onClick={() => handleNavClick('/admin')}
                      >
                        <Shield className="h-5 w-5 mr-3" />
                        Admin Panel
                      </Button>
                    )}
                    
                    <div className="border-t border-border my-2" />
                    
                    <Button
                      variant="ghost"
                      className="justify-start h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
