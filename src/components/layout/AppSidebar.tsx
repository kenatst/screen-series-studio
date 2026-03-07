import {
  LayoutDashboard, FolderOpen, LayoutGrid, Image, Palette, Globe,
  GitBranch, Settings, CreditCard, Layers, HelpCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/dashboard/projects", icon: FolderOpen },
  { title: "Templates", url: "/templates", icon: LayoutGrid },
  { title: "Generated Sets", url: "/dashboard/sets", icon: Image },
  { title: "Brand Kits", url: "/dashboard/brands", icon: Palette },
  { title: "Localizations", url: "/dashboard/locales", icon: Globe },
  { title: "A/B Variants", url: "/dashboard/variants", icon: GitBranch },
];

const bottomItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { title: "Help", url: "/dashboard/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-3 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && <span className="text-sm font-bold tracking-tight text-foreground">ScreenForge</span>}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
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
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
