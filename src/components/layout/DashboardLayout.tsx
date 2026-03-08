import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const initials = user?.email?.substring(0, 2).toUpperCase() || "US";

  return (
    <SidebarProvider>
      <div className="dark min-h-screen flex w-full bg-background selection:bg-primary/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b border-border px-6 bg-background/60 backdrop-blur-md sticky top-0 z-40 shadow-sm">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-foreground" />
            <div className="flex-1 flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Dashboard</div>
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-xs font-bold text-foreground shadow-inner cursor-pointer hover:border-border transition-colors">
                {initials}
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
