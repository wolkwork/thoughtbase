import {
  BrowserIcon,
  GearSixIcon,
  HandWavingIcon,
  KanbanIcon,
  NewspaperIcon,
  SparkleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { Link, useLocation, useNavigate, useRouteContext } from "@tanstack/react-router";
import { FeedbackWidget } from "@thoughtbase/widget";
import { ChevronsUpDown, CircleDashed, LogOut, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { OnboardingDialog } from "~/components/onboarding-dialog";
import { StatusBadge, STATUSES } from "~/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useOrganization } from "~/hooks/organization";
import { usePermissions } from "~/hooks/use-permissions";
import { authClient } from "~/lib/auth/auth-client-convex";
import { Permission } from "~/plans";
import { CreateIdeaDialog } from "./create-idea-dialog";
import { SidebarOrganizationSwitcher } from "./sidebar-organization-switcher";
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
import { UserAvatar } from "./user-avatar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  counts?: Record<string, number>;
  orgSlug: string;
}

export function AppSidebar({ counts = {}, orgSlug, ...props }: AppSidebarProps) {
  const { user } = useRouteContext({ from: "/(authenticated)" });

  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const organization = useOrganization();

  const location = useLocation();

  const { hasPermission } = usePermissions();
  const canWrite = hasPermission(Permission.WRITE);

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
              disabled={!canWrite}
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
              {Object.entries(STATUSES).map(([statusSlug]) => {
                const isStatusActive = location.search?.status === statusSlug;
                return (
                  <SidebarMenuItem
                    key={statusSlug}
                    className="flex items-center gap-2 text-black/70"
                  >
                    <SidebarMenuButton
                      isActive={isStatusActive}
                      render={
                        <Link
                          to="/dashboard/$orgSlug/ideas"
                          params={{ orgSlug }}
                          search={{ status: statusSlug }}
                        >
                          <StatusBadge status={statusSlug} iconClassName="size-5" />
                        </Link>
                      }
                    />
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
                  render={
                    <Link
                      to="/dashboard/$orgSlug/ideas"
                      params={{ orgSlug }}
                      search={{ status: undefined }}
                    >
                      <CircleDashed className="size-5 text-gray-400" />
                      <span>All Ideas</span>
                    </Link>
                  }
                  isActive={
                    location.pathname.includes("/ideas") && !location.search?.status
                  }
                />

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
                  render={
                    <Link
                      to="/dashboard/$orgSlug/roadmap"
                      params={{ orgSlug }}
                      className="flex gap-2.5 text-black/70"
                    >
                      <KanbanIcon
                        className="size-5.5!"
                        weight="duotone"
                        color="#7d7d7d"
                      />
                      <span>Roadmap</span>
                    </Link>
                  }
                  isActive={location.pathname.includes("/roadmap")}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
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
                  }
                  isActive={location.pathname.includes("/changelog")}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
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
                      <span>Contributors</span>
                    </Link>
                  }
                  isActive={location.pathname.includes("/members")}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link
                      to="/dashboard/$orgSlug/settings"
                      params={{ orgSlug }}
                      className="flex gap-2.5 text-black/70"
                      search={{ success: false }}
                    >
                      <GearSixIcon
                        className="size-5.5!"
                        weight="duotone"
                        color="#7d7d7d"
                      />
                      <span>Settings</span>
                    </Link>
                  }
                  isActive={location.pathname.includes("/settings")}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <a
                      href={`https://${orgSlug}.thoughtbase.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-2.5 text-black/70"
                    >
                      <BrowserIcon
                        className="size-5.5!"
                        weight="duotone"
                        color="#7d7d7d"
                      />
                      <span>My Board</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2">
            <SidebarMenuButton
              onClick={() => setOnboardingOpen(true)}
              render={
                <Button
                  variant="outline"
                  className="border-border h-auto! w-full items-start! justify-start rounded-lg border bg-white text-start"
                >
                  <HandWavingIcon weight="duotone" className="mt-0.5 size-5!" />
                  <div>
                    <div>Welcome, {user?.name}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Click here to get started!
                    </div>
                  </div>
                </Button>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setWidgetOpen(true)}
              render={
                <Button
                  variant="outline"
                  className="border-border h-auto! w-full justify-start rounded-lg border bg-white"
                >
                  <SparkleIcon className="size-4.5!" weight="bold" />
                  <span>Got Ideas? Tell Us!</span>
                </Button>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <UserAvatar user={user} />
                    <div className="grid flex-1 gap-0.5 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user?.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4!" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  render={
                    <Link
                      to="/dashboard/$orgSlug/account"
                      params={{ orgSlug }}
                      className="flex items-center"
                    >
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  }
                />
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
        organizationId={organization._id}
        onSuccess={(newIdea) => {
          navigate({
            to: "/dashboard/$orgSlug/ideas/$ideaId",
            params: { orgSlug, ideaId: newIdea._id },
          });
        }}
      />
      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        orgSlug={orgSlug}
        organizationId={organization._id}
      />
      <FeedbackWidget
        isOpen={widgetOpen}
        onClose={() => setWidgetOpen(false)}
        organizationSlug={process.env.NODE_ENV === "production" ? "feedback" : orgSlug}
      />
    </Sidebar>
  );
}
