import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  MoreHorizontal,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/lib/auth/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

export const Route = createFileRoute("/(authenticated)/dashboard/members/")({
  component: MembersPage,
});

function MembersPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session?.activeOrganizationId;

  const { data: members, isPending: isMembersLoading } = useQuery({
    queryKey: ["members", organizationId],
    queryFn: async () => {
      const { data } = await authClient.organization.listMembers();
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: invitations, isPending: isInvitationsLoading } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: async () => {
      const { data } = await authClient.organization.listInvitations();
      return data;
    },
    enabled: !!organizationId,
  });

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage your organization members and invitations.
          </p>
        </div>
        <InviteMemberDialog />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active Members</h2>
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
                  <MemberRow key={member.id} member={member} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {invitations && invitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
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

function MemberRow({ member }: { member: any }) {
  // member object usually has .user and .role
  // Adjust based on better-auth response structure.
  // Usually: { id, role, userId, user: { name, email, image } }
  const user = member.user;
  const router = useRouter();

  const handleRemoveMember = async () => {
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: member.userId, 
      });
      toast.success("Member removed");
      router.invalidate();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    try {
      await authClient.organization.updateMemberRole({
        memberId: member.userId,
        role: newRole,
      });
      toast.success("Role updated");
      router.invalidate();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  return (
    <TableRow>
      <TableCell className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Select defaultValue={member.role} onValueChange={handleUpdateRole}>
            <SelectTrigger className="w-[110px] h-8">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {new Date(member.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleRemoveMember} className="text-red-600">
              <UserMinus className="mr-2 h-4 w-4" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function InvitationRow({ invitation }: { invitation: any }) {
  const router = useRouter();
  const handleRevoke = async () => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });
      toast.success("Invitation revoked");
      router.invalidate();
    } catch (error) {
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
      <TableCell>
        {new Date(invitation.expiresAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
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

function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "owner">("member");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authClient.organization.inviteMember({
        email,
        role,
      });
      toast.success("Invitation sent");
      setOpen(false);
      setEmail("");
      router.invalidate();
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization.
          </DialogDescription>
        </DialogHeader>
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
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as "member" | "admin" | "owner")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

