import {
  LayoutDashboard, LayoutGrid,
  Settings, HelpCircle, LogOut,
} from "lucide-react";
import appLogo from "@/assets/logo-shotapp.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Templates", url: "/templates", icon: LayoutGrid },
];

const bottomItems = [
  { title: "Settings & Billing", url: "/dashboard/settings", icon: Settings },
  { title: "Help", url: "mailto:support@shotapp.ai", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-3 py-4">
            <img src={appLogo} alt="ShotApp AI" className="h-8 w-8 rounded-lg shadow-glow object-cover flex-shrink-0" />
            {!collapsed && <span className="text-base font-bold tracking-tight text-foreground drop-shadow-md">ShotApp AI</span>}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors" activeClassName="bg-white/10 text-foreground font-medium border-l-2 border-primary rounded-l-none !opacity-100">
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.url.startsWith('/') && isActive(item.url)}>
                {item.url.startsWith('mailto:') ? (
                  <a href={item.url} className="hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors">
                    <item.icon className="mr-3 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </a>
                ) : (
                  <NavLink to={item.url} end className="hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors" activeClassName="bg-white/10 text-foreground font-medium border-l-2 border-primary rounded-l-none !opacity-100">
                    <item.icon className="mr-3 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
