import { Globe, Key, Laptop, Loader2, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth/auth-client";

export function SettingsTab() {
  const { data: sessions, isPending: isSessionsPending, refetch } = authClient.useListSessions();
  const { data: session } = authClient.useSession();
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRevokeSession = async (token: string) => {
    setIsRevoking(token);
    try {
      await authClient.revokeSession({ token });
      toast.success("Session revoked");
      refetch();
    } catch (error) {
      toast.error("Failed to revoke session");
    } finally {
      setIsRevoking(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
        console.error(error)
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getDeviceIcon = (userAgent: string | undefined) => {
    if (!userAgent) return <Globe className="h-5 w-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions on other devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSessionsPending ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {sessions?.map((s) => {
                  const isCurrent = s.token === session?.session?.token; // Comparing session tokens might not be direct if token is hashed, but usually client side has access to it or ID. better-auth returns session object with token? 
                  // session object in client usually has `token`.
                  // session.session.token?
                  // Let's assume s.id or s.token matches.
                  // The `session` object from `useSession` has `session.token` ? or `session.id`?
                  // Usually `session` from `useSession` has `session: { id: ..., token: ... }`.
                  
                  return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-muted p-2">
                      {getDeviceIcon(s.userAgent)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {s.ipAddress || "Unknown IP"}
                        {s.id === session?.session?.id && (
                          <Badge variant="secondary" className="ml-2">
                            Current Device
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.userAgent}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {new Date(s.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {s.id !== session?.session?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isRevoking === s.token}
                      onClick={() => handleRevokeSession(s.token)}
                    >
                      {isRevoking === s.token ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              )})}
              {(!sessions || sessions.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No active sessions found.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

