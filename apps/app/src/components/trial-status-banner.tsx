import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { usePermissions } from "~/hooks/use-permissions";
import { Permission } from "~/plans";
import { SubscriptionDialog } from "./subscription-dialog";

export function TrialStatusBanner() {
  const { hasPermission, plan } = usePermissions();
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  if (hasPermission(Permission.WRITE)) {
    return null;
  }

  return (
    <>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                This workspace is now read-only. Subscribe or start a 14-day free trial to
                continue.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                All your data will be here when you're ready!
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsSubscriptionOpen(true)}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            Upgrade to continue
          </Button>
        </div>
      </div>
      <SubscriptionDialog
        open={isSubscriptionOpen}
        onOpenChange={setIsSubscriptionOpen}
      />
    </>
  );
}
