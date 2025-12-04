import {
  BrowserIcon,
  FileIcon,
  GearSixIcon,
  KanbanIcon,
  SparkleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, CircleDashed, LogOut, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { StatusBadge, STATUSES } from "~/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authClient } from "~/lib/auth/auth-client";
import { CreateIdeaDialog } from "./create-idea-dialog";
import { FeedbackWidget } from "@feedback-tool/widget";
import { SidebarOrganizationSwitcher } from "./sidebar-organization-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  counts?: Record<string, number>;
}

export function AppSidebar({ counts = {}, ...props }: AppSidebarProps) {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const organizationId = session?.session?.activeOrganizationId;
  const user = session?.user;

  const activeOrg = organizations?.find((org) => org.id === organizationId);
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
      external: true,
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
              Create Idea
              <Plus className="ml-auto" />
            </Button>
          </div>
          <SidebarGroupLabel className="text-muted-foreground tracking-wider uppercase">
            Ideas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(STATUSES).map(([slug, config]) => {
                const isStatusActive = location.search?.status === slug;
                return (
                  <SidebarMenuItem
                    key={slug}
                    className="flex items-center gap-2 text-black/70"
                  >
                    <SidebarMenuButton asChild isActive={isStatusActive}>
                      <Link to="/dashboard/ideas" search={{ status: slug }}>
                        <StatusBadge status={slug} iconClassName="size-5" />
                      </Link>
                    </SidebarMenuButton>
                    {counts[slug] > 0 && (
                      <SidebarMenuBadge className="mr-0.5">
                        {counts[slug]}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem className="flex items-center">
                <SidebarMenuButton
                  asChild
                  isActive={
                    location.pathname === "/dashboard/ideas" && !location.search?.status
                  }
                >
                  <Link to="/dashboard/ideas" search={{ status: undefined }}>
                    <CircleDashed className="size-5 text-gray-400" />
                    <span>All Ideas</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="mr-0.5">
                  {Object.values(counts).reduce((a, b) => a + b, 0)}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground tracking-wider uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link
                      to={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="flex gap-2.5 text-black/70"
                    >
                      <item.icon className="size-5.5!" weight="duotone" color="#7d7d7d" />
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
            <SidebarMenuButton asChild onClick={() => setWidgetOpen(true)}>
              <Button
                variant="outline"
                className="border-border justify-start rounded-lg border bg-white text-start"
              >
                <SparkleIcon weight="bold" />
                <span>Got Ideas? Tell Us!</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.slice(0, 2)?.toUpperCase() || "CN"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4!" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/account" })}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => authClient.signOut()}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
