import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Copy, CreditCard, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BrandingSettings } from "~/components/branding-settings";
import { SubscriptionDialog } from "~/components/subscription-dialog";
import { TeamSettings } from "~/components/team-settings";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { $generateOrgSecret, $getOrgSecret } from "~/lib/api/organizations";
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/(authenticated)/dashboard/settings/")({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: search.success === "true" || search.success === true,
    };
  },
});

function SettingsPage() {
  const search = useSearch({ from: "/(authenticated)/dashboard/settings/" });
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(!!search.success);
  const { data: organization } = authClient.useActiveOrganization();

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and integrations.
        </p>
      </div>

      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsSubscriptionOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
          <SubscriptionDialog
            open={isSubscriptionOpen}
            onOpenChange={setIsSubscriptionOpen}
          />
        </TabsContent>

        <TabsContent value="sso" className="mt-6">
          <SSOSettings organization={organization} />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <TeamSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SSOSettings({ organization }: { organization: any }) {
  const { data: secretData, refetch } = useQuery({
    queryKey: ["org-secret", organization?.id],
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
    <Card>
      <CardHeader>
        <CardTitle>SSO Secret</CardTitle>
        <CardDescription>
          Use this secret to sign JWTs for Single Sign-On (SSO) from your external
          application. Keep this secret safe!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {organization?.id && (
          <div className="text-muted-foreground mb-2 text-xs">
            Org ID: {organization.id}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={secretData?.secret || "No secret generated"}
            readOnly
            type="password" // Initially hidden
            className="font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            disabled={!secretData?.secret}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => generateSecret(undefined)}
            disabled={isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            {secretData?.secret ? "Rotate Secret" : "Generate Secret"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
