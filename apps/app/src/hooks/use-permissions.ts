import { useOrganization } from "./organization";
import { useConfig } from "./use-config";

/**
 * Hook to get permissions for an organization from route context
 */
export function usePermissions() {
  const organization = useOrganization();
  const { isCloud } = useConfig();

  const canWrite = (): boolean => {
    // All features enabled in self-hosted mode
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
