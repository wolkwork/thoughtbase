import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { CustomDomain } from "~/components/custom-domain";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { usePermissions } from "~/hooks/use-permissions";
import { $getCustomDomainStatus } from "~/lib/api/organizations";
import { Permission } from "~/plans";

interface CustomDomainSettingsProps {
  organizationId: string;
  onUpgrade?: () => void;
}

export function CustomDomainSettings({
  organizationId,
  onUpgrade,
}: CustomDomainSettingsProps) {
  const { hasPermission } = usePermissions();
  const canUseCustomDomain = hasPermission(Permission.CUSTOM_DOMAIN);

  const { data: domainStatus, isLoading } = useQuery({
    queryKey: ["custom-domain-status", organizationId],
    queryFn: () => $getCustomDomainStatus({ data: { organizationId } }),
    enabled: !!organizationId,
  });

  if (!canUseCustomDomain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Use your own subdomain for your Thoughtbase board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Custom domains are available on the Pro and Business plans.{" "}
              {onUpgrade && (
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold"
                  onClick={onUpgrade}
                >
                  Upgrade now
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <LoaderCircle className="animate-spin" />;
  }

  return (
    <CustomDomain
      defaultDomain={domainStatus?.domain || undefined}
      organizationId={organizationId}
    />
  );
}
