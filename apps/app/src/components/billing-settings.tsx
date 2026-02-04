import { useRouteContext } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { useAction } from "convex/react";
import startCase from "lodash/startCase";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { SubscriptionStatusBanner } from "./subscription-status-banner";

export function BillingSettings() {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const { organization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const getBillingPortalUrl = useAction(api.permissions.getBillingPortalUrl);

  const subscriptionStatus = organization.subscriptionStatus;
  const subscriptionPeriodEnd = organization.subscriptionPeriodEnd;

  const isActive = subscriptionStatus === "active";
  const isTrialing = subscriptionStatus === "trialing";
  const hasSubscription = isActive || isTrialing || subscriptionStatus === "scheduled";

  const currentPeriodEnd = subscriptionPeriodEnd ? new Date(subscriptionPeriodEnd) : null;
  const daysRemaining =
    isTrialing && currentPeriodEnd
      ? Math.ceil(
          (currentPeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const result = await getBillingPortalUrl({
        organizationId: organization._id,
        returnUrl: window.location.href,
      });
      if (result?.url) {
        window.open(result.url, "_blank");
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  const getStatusVariant = (status: string | undefined) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "outline";
      case "scheduled":
        return "secondary";
      case "past_due":
      case "expired":
      case "canceled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription plan and billing details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={getStatusVariant(subscriptionStatus)}>
                {subscriptionStatus ? startCase(subscriptionStatus) : "No Subscription"}
              </Badge>
            </div>
            {isTrialing && daysRemaining !== null && (
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Trial ends in {daysRemaining} day
                {daysRemaining !== 1 ? "s" : ""}
              </p>
            )}
            {!isTrialing && currentPeriodEnd && hasSubscription && (
              <p className="text-muted-foreground text-sm">
                Renews on {currentPeriodEnd.toLocaleDateString()}
              </p>
            )}
            <SubscriptionStatusBanner />
          </div>
          <div className="flex items-center gap-2">
            {hasSubscription && (
              <Button
                variant="outline"
                onClick={handleOpenPortal}
                disabled={isPortalLoading}
              >
                {isPortalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
