import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenuButton } from "./ui/sidebar";
import { WorkspaceAvatar } from "./workspace-avatar";

interface SidebarOrganizationSwitcherProps {
  currentOrgSlug: string;
}

export function SidebarOrganizationSwitcher({
  currentOrgSlug,
}: SidebarOrganizationSwitcherProps) {
  const { organization: activeOrganization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const { data: organizations } = authClient.useListOrganizations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions", activeOrganization?.id],
    queryFn: async () => {
      const result = await authClient.customer.subscriptions.list({
        query: {
          referenceId: activeOrganization!.id,
          active: true,
          limit: 1,
        },
      });
      return result.data;
    },
    enabled: !!activeOrganization?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const activeSubscription = subscriptions?.result?.items?.[0];
  const planName = activeSubscription?.product?.name ?? "Free";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-none! bg-transparent! ring-0! outline-none"
            >
              <WorkspaceAvatar
                workspace={{
                  name: activeOrganization?.name,
                  logo: activeOrganization?.logo,
                }}
                className="text-sidebar-primary-foreground"
              />
              <div className="grid flex-1 gap-0.5 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization?.name || "Select Workspace"}
                </span>
                <span className="truncate text-xs text-emerald-600">{planName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4!" />
            </SidebarMenuButton>
          }
        />
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          side="bottom"
        >
          {organizations?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              className="gap-2 p-2"
              render={
                <Link to="/dashboard/$orgSlug" params={{ orgSlug: org.slug }}>
                  <WorkspaceAvatar
                    workspace={{ name: org.name, logo: org.logo }}
                    className="size-6"
                  />
                  {org.name}
                  {org.slug === currentOrgSlug && <Check className="ml-auto h-4 w-4" />}
                </Link>
              }
            />
          ))}
          {organizations?.length === 0 && (
            <div className="text-muted-foreground p-2 text-center text-sm">
              No organizations found.
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 p-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="size-4" />
            <div className="text-muted-foreground font-medium">Create Workspace</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
