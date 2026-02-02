import { AlertCircle } from "lucide-react";
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
import { useOrganization } from "~/hooks/organization";
import { usePermissions } from "~/hooks/use-permissions";
import { Permission } from "~/plans";

interface CustomDomainSettingsProps {
  onUpgrade?: () => void;
}

export function CustomDomainSettings({ onUpgrade }: CustomDomainSettingsProps) {
  const { hasPermission } = usePermissions();
  const canUseCustomDomain = hasPermission(Permission.CUSTOM_DOMAIN);
  const organization = useOrganization();

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

  return (
    <CustomDomain
      defaultDomain={organization?.customDomain || undefined}
      organizationId={organization?._id}
    />
  );
}
