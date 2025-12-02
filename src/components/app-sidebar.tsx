import { Link, useLocation } from "@tanstack/react-router";
import {
  MessageSquare,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { CreateIdeaDialog } from "./create-idea-dialog";
import { FeedbackWidget } from "./feedback-widget";
import { SidebarOrganizationSwitcher } from "./sidebar-organization-switcher";
import { StatusBadge, STATUSES } from "~/components/status-badge";
import { Button } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";
import { KanbanIcon, FileIcon, UserCircleIcon, GearSixIcon, BrowserIcon } from "@phosphor-icons/react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  counts?: Record<string, number>;
}

export function AppSidebar({ counts = {}, ...props }: AppSidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const organizationId = session?.session?.activeOrganizationId;
  
  const activeOrg = organizations?.find(org => org.id === organizationId);
  const orgSlug = activeOrg?.slug;

  const location = useLocation();

  const workspaceItems = [
    { name: "Roadmap", href: "/dashboard/roadmap", icon: KanbanIcon },
    { name: "Changelog", href: "/dashboard/changelog", icon: FileIcon },
    { name: "Members", href: "/dashboard/members", icon: UserCircleIcon },
    { name: "Settings", href: "/dashboard/settings", icon: GearSixIcon },
    { 
        name: "My Board", 
        href: orgSlug ? `/org/${orgSlug}` : "#", 
        icon: BrowserIcon,
        external: true 
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarOrganizationSwitcher />
      </SidebarHeader>
      
      <SidebarContent className="px-1">
        <SidebarGroup>
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
             <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setCreateDialogOpen(true)}
            >
                Create Request
                <Plus className="ml-auto" />
            </Button>
        </div>
            <SidebarGroupLabel className="uppercase tracking-wider text-muted-foreground">Ideas</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {Object.entries(STATUSES).map(([slug, config]) => {
                        const isStatusActive = location.search?.status === slug;
                        return (
                        <SidebarMenuItem key={slug} className="text-black/70">
                            <SidebarMenuButton asChild isActive={isStatusActive}>
                                <Link 
                                    to="/dashboard/ideas" 
                                    search={{ status: slug }}
                                >
                                    <StatusBadge status={slug} iconClassName="size-5" />
                                </Link>
                            </SidebarMenuButton>
                            {counts[slug] > 0 && (
                                <SidebarMenuBadge>{counts[slug]}</SidebarMenuBadge>
                            )}
                        </SidebarMenuItem>
                    )})}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/dashboard/ideas" && !location.search?.status}>
                             <Link to="/dashboard/ideas" search={{ status: undefined }}>
                                <StatusBadge status="all" showLabel={false} iconClassName="text-gray-400 size-5" />
                                <span>All Ideas</span>
                             </Link>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>
                            {Object.values(counts).reduce((a, b) => a + b, 0)}
                        </SidebarMenuBadge>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel className="uppercase tracking-wider text-muted-foreground">Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {workspaceItems.map((item) => (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                                <Link 
                                    to={item.href} 
                                    target={item.external ? "_blank" : undefined}
                                    rel={item.external ? "noopener noreferrer" : undefined}
                                    className="text-black/70 flex gap-2.5"
                                >
                                    <item.icon className="size-5.5!" weight="duotone" color="#7d7d7d"  />
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setWidgetOpen(true)}>
                    <MessageSquare />
                    <span>Test Widget</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      
      <CreateIdeaDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {organizationId && (
          <FeedbackWidget 
            isOpen={widgetOpen} 
            onClose={() => setWidgetOpen(false)} 
            organizationId={organizationId}
          />
      )}
    </Sidebar>
  );
}
