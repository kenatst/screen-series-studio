import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initials = user?.email?.substring(0, 2).toUpperCase() || "US";

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isDeepRoute = pathSegments.length > 1 || location.pathname === '/templates';

  // Capitalize first letter of each segment
  const breadcrumbs = pathSegments.map(segment =>
    segment.charAt(0).toUpperCase() + segment.slice(1)
  );
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b border-border px-6 bg-background/60 backdrop-blur-md sticky top-0 z-40 shadow-sm">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-foreground" />
            <div className="flex-1 flex items-center justify-between">

              <div className="flex items-center gap-2 text-sm font-medium">
                {isDeepRoute && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-2"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </button>
                )}

                <span className={isDeepRoute ? "text-muted-foreground" : "text-foreground"}>
                  Dashboard
                </span>

                {isDeepRoute && breadcrumbs.map((crumb, index) => {
                  if (crumb.toLowerCase() === 'dashboard') return null;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className={index === breadcrumbs.length - 1 ? "text-foreground font-bold" : "text-muted-foreground"}>
                        {crumb}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold text-foreground shadow-inner cursor-pointer hover:border-border transition-colors">
                  {initials}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8 relative">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
