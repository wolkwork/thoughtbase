import { useRouter } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/lib/auth/auth-client";
import { cn } from "~/lib/utils";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function OrganizationSwitcher() {
  const { data: organizations } = authClient.useListOrganizations();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
      setOpen(false);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to switch organization");
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {activeOrganization?.name || "Select Organization"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations?.map((org) => (
            <DropdownMenuItem key={org.id} onSelect={() => handleSetActive(org.id)}>
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  activeOrganization?.id === org.id ? "opacity-100" : "opacity-0",
                )}
              />
              {org.name}
            </DropdownMenuItem>
          ))}
          {organizations?.length === 0 && (
            <div className="text-muted-foreground p-2 text-center text-sm">
              No organizations found.
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
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
