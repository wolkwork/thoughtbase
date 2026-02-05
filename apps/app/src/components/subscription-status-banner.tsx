import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { AlertCircle, CircleFadingArrowUp, Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useOrganization } from "~/hooks/organization";
import { useConfig } from "~/hooks/use-config";

export function SubscriptionStatusBanner() {
  const { isCloud } = useConfig();
  const organization = useOrganization();
  const [status, setStatus] = React.useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );
  const upgrade = useConvexAction(api.organizations.checkout);

  // Hide billing banner in self-hosted mode
  if (!isCloud) {
    return null;
  }

  async function handleUpgrade() {
    setStatus("pending");
    const checkout = await upgrade({
      organizationId: organization._id,
    });

    if (!checkout || !checkout.url) {
      setStatus("error");
      return toast.error("Something went wrong. Please try again.");
    }

    setStatus("success");
    window.open(checkout.url, "_blank");
  }

  if (organization.subscriptionStatus === "trialing") {
    const timeLeft = organization.subscriptionPeriodEnd
      ? organization.subscriptionPeriodEnd - Date.now()
      : 0;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    return (
      <>
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  You have {daysLeft} days left on your trial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (
    organization.subscriptionStatus !== "active" &&
    organization.subscriptionStatus !== "scheduled"
  ) {
    return (
      <>
        <button
          className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100 disabled:opacity-70 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-900/20"
          onClick={handleUpgrade}
          disabled={status === "pending"}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              {status === "pending" ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
              ) : (
                <CircleFadingArrowUp className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Your subscription has expired. Please upgrade to continue.
                </p>
              </div>
            </div>
          </div>
        </button>
      </>
    );
  }
}
