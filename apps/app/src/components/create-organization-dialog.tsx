import slugify from "@sindresorhus/slugify";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/lib/auth/auth-client-convex";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateOrganizationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateOrganizationDialog({
  trigger,
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const finalOpen = isControlled ? open : internalOpen;
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let slug = slugify(name);

      const slugExists = await authClient.organization.checkSlug({
        slug,
      });

      if (slugExists.error) {
        slug = slug + "-" + crypto.randomUUID().substring(0, 4);
      }

      const result = await authClient.organization.create({
        name,
        slug,
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Organization created successfully");
      finalOnOpenChange?.(false);

      // Navigate to the new org's dashboard
      const newOrgSlug = slug || result.data?.slug;
      if (newOrgSlug) {
        navigate({
          to: "/dashboard/$orgSlug",
          params: { orgSlug: newOrgSlug },
        });
      }

      setName("");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to manage your projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
