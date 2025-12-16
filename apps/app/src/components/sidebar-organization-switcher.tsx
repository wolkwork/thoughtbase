import { Link, useRouteContext } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { authClient } from "~/lib/auth/auth-client";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

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

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-none! bg-transparent! ring-0! outline-none"
                >
                  <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    {activeOrganization?.logo ? (
                      <img
                        src={activeOrganization.logo}
                        alt={activeOrganization.name}
                        className="size-8 rounded-lg"
                      />
                    ) : (
                      <span className="font-semibold">
                        {activeOrganization?.name?.substring(0, 2).toUpperCase() || "OR"}
                      </span>
                    )}
                  </div>
                  <div className="grid flex-1 gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {activeOrganization?.name || "Select Organization"}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      Free Plan
                    </span>
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
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organizations
              </DropdownMenuLabel>
              {organizations?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="gap-2 p-2"
                  render={
                    <Link to="/dashboard/$orgSlug" params={{ orgSlug: org.slug }}>
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="size-6 rounded-sm"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {org.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {org.name}
                      {org.slug === currentOrgSlug && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
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
                onSelect={() => setShowCreateDialog(true)}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Add Organization</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
