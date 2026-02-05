import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { RefreshCw } from "lucide-react";
import { BillingSettings } from "~/components/billing-settings";
import { BrandingSettings } from "~/components/branding-settings";
import { CustomDomainSettings } from "~/components/custom-domain-settings";
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
import { CopyButton } from "~/components/ui/shadcn-io/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useConfig } from "~/hooks/use-config";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { organization } = Route.useRouteContext();
  const { isCloud } = useConfig();

  // Number of tabs changes based on cloud mode (Billing and Domain are cloud-only)
  const tabCount = isCloud ? 5 : 3;

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings and integrations.
          </p>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList
            className="grid w-full max-w-md"
            style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
          >
            {isCloud && <TabsTrigger value="billing">Billing</TabsTrigger>}
            <TabsTrigger value="sso">SSO</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            {isCloud && <TabsTrigger value="domain">Domain</TabsTrigger>}
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {isCloud && (
            <TabsContent value="billing" className="mt-6">
              <BillingSettings />
            </TabsContent>
          )}

          <TabsContent value="sso" className="mt-6">
            <SSOSettings organization={organization} />
          </TabsContent>

          <TabsContent value="branding" className="mt-6">
            <BrandingSettings organizationId={organization._id} />
          </TabsContent>

          {isCloud && (
            <TabsContent value="domain" className="mt-6">
              <CustomDomainSettings />
            </TabsContent>
          )}

          <TabsContent value="team" className="mt-6">
            <TeamSettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function SSOSettings({
  organization,
}: {
  organization: { _id: string; name: string; slug: string };
}) {
  const { data: secretData } = useQuery(
    convexQuery(api.organizations.getOrgSecret, {
      organizationId: organization._id,
    }),
  );

  const generateSecret = useConvexMutation(api.organizations.generateOrgSecret);

  const handleGenerateSecret = () => {
    generateSecret({ organizationId: organization._id });
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
        {secretData?.secret && (
          <div className="flex gap-2">
            <Input
              value={secretData.secret}
              readOnly
              type="password"
              className="font-mono"
            />
            <CopyButton variant="outline" content={secretData.secret} />
          </div>
        )}

        <div className="flex">
          <Button variant="destructive" onClick={handleGenerateSecret}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {secretData?.secret ? "Generate New Secret" : "Generate Secret"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
