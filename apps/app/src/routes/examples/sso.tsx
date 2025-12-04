import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SignJWT } from "jose";
import { useState } from "react";
import { toast } from "sonner";
import { FeedbackWidget } from "~/components/feedback-widget";
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
import { $getOrgSecret } from "~/lib/api/organizations";
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/examples/sso")({
  component: SSOExamplePage,
});

function SSOExamplePage() {
  const { data: session } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("external-user@example.com");
  const [id, setId] = useState("external-user-123");
  const [name, setName] = useState("External User");
  const [avatarUrl, setAvatarUrl] = useState(
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  );
  const [ssoToken, setSsoToken] = useState("");

  // Manual inputs for organization ID and secret
  const [manualOrgId, setManualOrgId] = useState("");
  const [manualSecret, setManualSecret] = useState("");

  // Auto-fill from session if available
  const { data: secretData } = useQuery({
    queryKey: ["org-secret"],
    queryFn: () => $getOrgSecret(),
    enabled: !!session?.user,
  });

  // Effect to auto-fill if logged in
  if (session?.session?.activeOrganizationId && !manualOrgId) {
    setManualOrgId(session.session.activeOrganizationId);
  }
  if (secretData?.secret && !manualSecret) {
    setManualSecret(secretData.secret);
  }

  const generateToken = async () => {
    if (!manualSecret) {
      toast.error("Please enter an organization secret.");
      return;
    }
    if (!manualOrgId) {
      toast.error("Please enter an organization ID.");
      return;
    }

    const secret = new TextEncoder().encode(manualSecret);

    try {
      const token = await new SignJWT({
        sub: id,
        email,
        name,
        image: avatarUrl,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret);

      setSsoToken(token);
      setIsOpen(true);
      toast.success("SSO Token generated & Widget opened");
    } catch (e) {
      toast.error("Failed to generate token");
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>SSO Integration Example</CardTitle>
          <CardDescription>
            Simulate an external website embedding the widget with SSO. Enter your
            Organization ID and Secret manually, or log in as admin to auto-fill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 border-b pb-6">
            <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Organization Config
            </h3>
            <div className="grid gap-2">
              <Label>Organization ID</Label>
              <Input
                value={manualOrgId}
                onChange={(e) => setManualOrgId(e.target.value)}
                placeholder="org_..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Organization Secret</Label>
              <Input
                type="password"
                value={manualSecret}
                onChange={(e) => setManualSecret(e.target.value)}
                placeholder="Secret key..."
              />
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              User Data
            </h3>
            <div className="grid gap-2">
              <Label>User ID</Label>
              <Input value={id} onChange={(e) => setId(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>User Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>User Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Avatar URL</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4">
            <Button onClick={generateToken}>Generate Token & Open Widget</Button>
          </div>

          {ssoToken && (
            <div className="bg-muted overflow-hidden rounded-md p-4">
              <p className="text-muted-foreground font-mono text-xs break-all">
                {ssoToken}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {manualOrgId && (
        <FeedbackWidget
          organizationId={manualOrgId}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          ssoToken={ssoToken}
        />
      )}
    </div>
  );
}
