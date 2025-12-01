import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { $generateOrgSecret, $getOrgSecret } from "~/lib/api/organizations";
import { auth } from "~/lib/auth/auth";
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/(authenticated)/dashboard/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
const {data: organization} = authClient.useActiveOrganization()

  const { data: secretData, refetch } = useQuery({
    queryKey: ["org-secret"],
    queryFn: () => $getOrgSecret(),
  });

  const { mutate: generateSecret, isPending } = useMutation({
    mutationFn: $generateOrgSecret,
    onSuccess: () => {
      toast.success("New secret generated");
      refetch();
    },
    onError: () => {
      toast.error("Failed to generate secret");
    },
  });

  const copyToClipboard = () => {
    if (secretData?.secret) {
      navigator.clipboard.writeText(secretData.secret);
      toast.success("Copied to clipboard");
    } 
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SSO Secret</CardTitle>
          <CardDescription>
            Use this secret to sign JWTs for Single Sign-On (SSO) from your external application.
            Keep this secret safe!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organization?.id}
          <div className="flex gap-2">
            <Input 
              value={secretData?.secret || "No secret generated"} 
              readOnly 
              type="password" // Initially hidden
              className="font-mono"
            />
             {/* Helper to toggle visibility could be nice but keeping simple for now */}
            <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!secretData?.secret}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => generateSecret()} disabled={isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              {secretData?.secret ? "Rotate Secret" : "Generate Secret"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

