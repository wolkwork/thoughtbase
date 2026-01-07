import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BillingSettings } from "~/components/billing-settings";
import { BrandingSettings } from "~/components/branding-settings";
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
import { $generateOrgSecret, $getOrgSecret } from "~/lib/api/organizations";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/settings/")({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: search.success === "true" || search.success === true,
    };
  },
});

function SettingsPage() {
  const search = useSearch({
    from: "/(authenticated)/dashboard/$orgSlug/settings/",
  });
  const { organization } = Route.useRouteContext();

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
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
          <BillingSettings defaultOpen={!!search.success} />
        </TabsContent>

        <TabsContent value="sso" className="mt-6">
          <SSOSettings organization={organization} />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSettings organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SSOSettings({
  organization,
}: {
  organization: { id: string; name: string; slug: string };
}) {
  const { data: secretData, refetch } = useQuery({
    queryKey: ["org-secret", organization.id],
    queryFn: () => $getOrgSecret({ data: { organizationId: organization.id } }),
  });

  const { mutate: generateSecret, isPending } = useMutation({
    mutationFn: () => $generateOrgSecret({ data: { organizationId: organization.id } }),
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
          <Button
            variant="destructive"
            onClick={() => generateSecret()}
            disabled={isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            {secretData?.secret ? "Generate New Secret" : "Generate Secret"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
