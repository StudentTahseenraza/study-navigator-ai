import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  Search, 
  Lock,
  Send, 
  CheckSquare,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/counsellor', label: 'AI Counsellor', icon: MessageSquare },
  { path: '/universities', label: 'Universities', icon: Search },
  { path: '/shortlist', label: 'My Shortlist', icon: Lock },
  { path: '/applications', label: 'Applications', icon: Send },
  { path: '/tasks', label: 'To-Do List', icon: CheckSquare },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/profile', label: 'Profile', icon: User },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
    if (!profileLoading && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [user, authLoading, profile, profileLoading, navigate, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStageLabel = () => {
    switch (profile?.current_stage) {
      case 'onboarding': return 'Onboarding';
      case 'profile_building': return 'Building Profile';
      case 'discovering': return 'Discovering';
      case 'shortlisting': return 'Shortlisting';
      case 'locked': return 'Universities Locked';
      case 'applying': return 'Applying';
      default: return 'Getting Started';
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">AI Counsellor</span>
          </Link>
        </div>

        {/* Stage Indicator */}
        <div className="p-4 mx-4 mt-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Current Stage</span>
          </div>
          <p className="font-display font-semibold mt-1">{getStageLabel()}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-sidebar-primary' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{profile?.full_name || 'Student'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <NotificationBell />
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold">AI Counsellor</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 space-y-2 animate-slide-up">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
