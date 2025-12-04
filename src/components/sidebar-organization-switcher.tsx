import { useRouter } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

export function SidebarOrganizationSwitcher() {
  const { data: organizations } = authClient.useListOrganizations();
  const { data: session } = authClient.useSession();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { isMobile } = useSidebar();
  const router = useRouter();

  const activeOrganization = organizations?.find(
    (org) => org.id === session?.session?.activeOrganizationId,
  );

  const handleSetActive = async (organizationId: string) => {
    try {
      await authClient.organization.setActive({
        organizationId,
      });
      toast.success("Organization switched");
      router.invalidate();
    } catch (error) {
      toast.error("Failed to switch organization");
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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
            </DropdownMenuTrigger>
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
                  onClick={() => handleSetActive(org.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="size-6 rounded-sm" />
                    ) : (
                      <span className="text-xs font-medium">
                        {org.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {org.name}
                  {activeOrganization?.id === org.id && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>
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
