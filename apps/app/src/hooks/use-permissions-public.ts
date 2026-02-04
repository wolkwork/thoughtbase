import { useLoaderData } from "@tanstack/react-router";
import { useConfig } from "./use-config";

/**
 * Hook to get permissions for an organization from route context
 */
export function usePermissionsPublic() {
  const { org: organization } = useLoaderData({ from: "/subdomain/$slug" });
  const { isCloud } = useConfig();

  const canWrite = (): boolean => {
    if (!isCloud) return true;

    const validStatuses = ["active", "trialing", "scheduled"];

    const isSubscriptionActive = validStatuses.includes(
      organization.subscriptionStatus ?? "",
    );

    if (!isSubscriptionActive) return false;

    return true;
  };

  return {
    canWrite,
  };
}
