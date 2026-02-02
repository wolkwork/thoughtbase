import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { AlertCircle, MoreHorizontal, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { useOrganization } from "~/hooks/organization";
import { usePermissions } from "~/hooks/use-permissions";
import { authClient } from "~/lib/auth/auth-client-convex";
import { Permission } from "~/plans";
import { UserAvatar } from "./user-avatar";

export function TeamSettings() {
  const organization = useOrganization();

  const organizationId = organization._id;

  const { data: members, isPending: isMembersLoading } = useQuery({
    queryKey: ["team-members", organizationId],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers({
        query: {
          organizationId,
        },
      });
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: invitations } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations({
        query: {
          organizationId,
        },
      });
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: permissions } = useQuery(
    convexQuery(api.permissions.getPermissions, {
      organizationId,
    }),
  );

  const isLimitReached =
    permissions && !permissions.canAddAdmin && permissions.maxAdmins !== null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage your organization members and invitations.
          </p>
        </div>
        <InviteMemberDialog organizationId={organizationId} permissions={permissions} />
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Active Members</h3>
        {isLimitReached && permissions && (
          <Alert
            variant="default"
            className="border-amber-400 bg-amber-50/50 text-amber-900"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-amber-900">
              You've reached the admin limit for your <strong>{permissions.tier}</strong>{" "}
              plan (
              {permissions.maxAdmins === null
                ? "unlimited"
                : `${permissions.maxAdmins} admin${permissions.maxAdmins !== 1 ? "s" : ""}`}
              ).
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isMembersLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : members?.members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                members?.members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    organizationId={organizationId}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {invitations && invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Pending Invitations</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <InvitationRow key={invitation.id} invitation={invitation} />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

type TeamMember = {
  id: string;
  userId: string;
  role: "admin" | "member" | "owner" | string;
  createdAt: string | Date;
  user: {
    image?: string | null;
    name?: string | null;
    email: string;
  };
};

type TeamInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string | Date;
};

function MemberRow({
  member,
  organizationId,
}: {
  member: TeamMember;
  organizationId?: string;
}) {
  const user = member.user;
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission(Permission.WRITE);

  const handleRemoveMember = async () => {
    if (!canWrite) {
      toast.error("Your trial has ended. Upgrade to manage team members.");
      return;
    }
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: member.userId,
      });
      toast.success("Member removed");
      router.invalidate();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async (newRole: string | null) => {
    if (!newRole) return;
    if (!canWrite) {
      toast.error("Your trial has ended. Upgrade to manage team members.");
      return;
    }
    try {
      await authClient.organization.updateMemberRole({
        memberId: member.userId,
        role: newRole,
      });
      toast.success("Role updated");
      router.invalidate();
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <TableRow>
      <TableCell className="flex items-center gap-3">
        {/* TODO: fix */}
        {/* @ts-expect-error - user is not typed */}
        <UserAvatar user={user} />
        <div className="flex flex-col">
          <span className="font-medium">{user.name || user.email}</span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Select
          defaultValue={member.role}
          onValueChange={handleUpdateRole}
          disabled={!canWrite}
        >
          <SelectTrigger className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleRemoveMember}
              disabled={!canWrite}
              className="text-red-600"
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function InvitationRow({ invitation }: { invitation: TeamInvitation }) {
  const router = useRouter();
  const handleRevoke = async () => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });
      toast.success("Invitation revoked");
      router.invalidate();
    } catch {
      toast.error("Failed to revoke invitation");
    }
  };

  return (
    <TableRow>
      <TableCell>{invitation.email}</TableCell>
      <TableCell>
        <Badge variant="outline">{invitation.role}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={invitation.status === "pending" ? "secondary" : "default"}>
          {invitation.status}
        </Badge>
      </TableCell>
      <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRevoke} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Revoke Invitation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function InviteMemberDialog({
  organizationId,
  permissions,
}: {
  organizationId: string;
  permissions?: {
    tier: string;
    maxAdmins: number | null;
    currentAdminCount: number;
    canAddAdmin: boolean;
  } | null;
}) {
  const [open, setOpen] = useState(false);

  const isDisabled = !!permissions && !permissions.canAddAdmin;
  const tooltipMessage =
    permissions && !permissions.canAddAdmin && permissions.maxAdmins !== null
      ? `Admin limit reached. Your ${permissions.tier} plan allows ${permissions.maxAdmins} admin${permissions.maxAdmins !== 1 ? "s" : ""}. You currently have ${permissions.currentAdminCount} admin${permissions.currentAdminCount !== 1 ? "s" : ""} (including owners).${permissions.tier !== "business" ? " Upgrade to Business for unlimited admins." : ""}`
      : undefined;

  const button = (
    <Button disabled={isDisabled}>
      <UserPlus className="mr-2 h-4 w-4" />
      Invite Member
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {tooltipMessage ? (
        <Tooltip>
          <TooltipTrigger render={<DialogTrigger render={button} />} />

          <TooltipContent>
            <p className="max-w-xs">{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger render={button} />
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization.
          </DialogDescription>
        </DialogHeader>
        <InviteMemberForm
          organizationId={organizationId}
          onSuccess={() => setOpen(false)}
          submitLabel="Send Invitation"
          permissions={permissions}
        />
      </DialogContent>
    </Dialog>
  );
}

export function InviteMemberForm({
  organizationId,
  onSuccess,
  submitLabel = "Invite Member",
  permissions,
}: {
  organizationId: string;
  onSuccess?: () => void;
  submitLabel?: string;
  permissions?: {
    tier: string;
    maxAdmins: number | null;
    currentAdminCount: number;
    canAddAdmin: boolean;
  } | null;
}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission(Permission.WRITE);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canWrite) {
      toast.error("Your trial has ended. Upgrade to invite team members.");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.organization.inviteMember({
        organizationId,
        email,
        role: "admin",
      });
      toast.success("Invitation sent");
      setEmail("");
      onSuccess?.();
      router.invalidate();
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      {!canWrite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
          Your trial has ended. Upgrade to invite team members.
        </div>
      )}
      <DialogFooter>
        <Button type="submit" disabled={isLoading || !canWrite}>
          {isLoading ? "Sending..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
