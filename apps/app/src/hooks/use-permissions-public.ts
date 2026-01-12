import { useLoaderData } from "@tanstack/react-router";
import { Permission } from "~/plans";

/**
 * Hook to get permissions for an organization from route context
 */
export function usePermissionsPublic() {
  const { plan } = useLoaderData({ from: "/org/$slug" });

  const hasPermission = (permission: Permission): boolean => {
    if (!plan) return false;

    return (plan.permissions as readonly Permission[]).includes(permission);
  };

  return {
    plan,
    permissions: plan.permissions,
    hasPermission,
  };
}
