import { FeedbackWidget } from "@feedback-tool/widget";
import {
  BrowserIcon,
  GearSixIcon,
  KanbanIcon,
  NewspaperIcon,
  SparkleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  Link,
  useLocation,
  useNavigate,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
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
  orgSlug: string;
}

export function AppSidebar({ counts = {}, orgSlug, ...props }: AppSidebarProps) {
  const { user } = useRouteContext({ from: "/(authenticated)" });

  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const { data: organizations } = authClient.useListOrganizations();

  const activeOrg = organizations?.find((org) => org.slug === orgSlug);
  const organizationId = activeOrg?.id;

  const location = useLocation();
  const router = useRouter();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarOrganizationSwitcher currentOrgSlug={orgSlug} />
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
              {Object.entries(STATUSES).map(([statusSlug, config]) => {
                const isStatusActive = location.search?.status === statusSlug;
                return (
                  <SidebarMenuItem
                    key={statusSlug}
                    className="flex items-center gap-2 text-black/70"
                  >
                    <SidebarMenuButton asChild isActive={isStatusActive}>
                      <Link
                        to="/dashboard/$orgSlug/ideas"
                        params={{ orgSlug }}
                        search={{ status: statusSlug }}
                      >
                        <StatusBadge status={statusSlug} iconClassName="size-5" />
                      </Link>
                    </SidebarMenuButton>
                    {counts[statusSlug] > 0 && (
                      <SidebarMenuBadge className="mr-0.5">
                        {counts[statusSlug]}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem className="flex items-center">
                <SidebarMenuButton
                  asChild
                  isActive={
                    location.pathname.includes("/ideas") && !location.search?.status
                  }
                >
                  <Link
                    to="/dashboard/$orgSlug/ideas"
                    params={{ orgSlug }}
                    search={{ status: undefined }}
                  >
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes("/roadmap")}
                >
                  <Link
                    to="/dashboard/$orgSlug/roadmap"
                    params={{ orgSlug }}
                    className="flex gap-2.5 text-black/70"
                  >
                    <KanbanIcon className="size-5.5!" weight="duotone" color="#7d7d7d" />
                    <span>Roadmap</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes("/changelog")}
                >
                  <Link
                    to="/dashboard/$orgSlug/changelog"
                    params={{ orgSlug }}
                    className="flex gap-2.5 text-black/70"
                  >
                    <NewspaperIcon
                      className="size-5.5!"
                      weight="duotone"
                      color="#7d7d7d"
                    />
                    <span>Changelog</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes("/members")}
                >
                  <Link
                    to="/dashboard/$orgSlug/members"
                    params={{ orgSlug }}
                    className="flex gap-2.5 text-black/70"
                  >
                    <UserCircleIcon
                      className="size-5.5!"
                      weight="duotone"
                      color="#7d7d7d"
                    />
                    <span>Members</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.includes("/settings")}
                >
                  <Link
                    to="/dashboard/$orgSlug/settings"
                    params={{ orgSlug }}
                    className="flex gap-2.5 text-black/70"
                  >
                    <GearSixIcon className="size-5.5!" weight="duotone" color="#7d7d7d" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href={`/org/${orgSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2.5 text-black/70"
                  >
                    <BrowserIcon className="size-5.5!" weight="duotone" color="#7d7d7d" />
                    <span>My Board</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/$orgSlug/account"
                    params={{ orgSlug }}
                    className="flex items-center"
                  >
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess() {
                          navigate({ to: "/login" });
                        },
                      },
                    });
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <CreateIdeaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        orgSlug={orgSlug}
        organizationId={organizationId}
      />
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
