import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { SubscriptionDialog } from "~/components/subscription-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { authClient } from "~/lib/auth/auth-client";

export function BillingSettings() {
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const { organization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const { data: subscriptions, isPending } = useQuery({
    queryKey: ["subscriptions", organization.id],
    queryFn: async () => {
      const result = await authClient.customer.subscriptions.list({
        query: {
          referenceId: organization.id,
          active: true,
          limit: 1,
        },
      });
      return result.data;
    },
    enabled: !!organization.id,
  });

  const activeSubscription = subscriptions?.result?.items?.[0];
  const planName = activeSubscription?.product?.name ?? "Free";
  const status = activeSubscription?.status;
  const currentPeriodEnd = activeSubscription?.currentPeriodEnd
    ? new Date(activeSubscription.currentPeriodEnd)
    : null;
  const isTrialing = status === "trialing";
  const trialEndDate = isTrialing && currentPeriodEnd ? currentPeriodEnd : null;
  const daysRemaining = trialEndDate
    ? Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const { data } = await authClient.customer.portal();
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } finally {
      setIsPortalLoading(false);
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
          {isPending ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subscription...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Current Plan:</span>
                <Badge variant={activeSubscription ? "default" : "secondary"}>
                  {planName}
                </Badge>
                {status && (
                  <Badge
                    variant={
                      status === "active"
                        ? "outline"
                        : status === "trialing"
                          ? "outline"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {status}
                  </Badge>
                )}
              </div>
              {isTrialing && daysRemaining !== null && (
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Trial ends in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                </p>
              )}
              {!isTrialing && currentPeriodEnd && (
                <p className="text-muted-foreground text-sm">
                  {activeSubscription?.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}{" "}
                  {currentPeriodEnd.toLocaleDateString()}
                </p>
              )}
              {!activeSubscription && (
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Trial Expired - Upgrade to continue
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            {activeSubscription && (
              <Button onClick={handleOpenPortal} disabled={isPortalLoading}>
                {isPortalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            )}

            <Button onClick={() => setIsSubscriptionOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
      <SubscriptionDialog
        open={isSubscriptionOpen}
        onOpenChange={setIsSubscriptionOpen}
      />
    </>
  );
}
