import { useRouteContext } from "@tanstack/react-router";
import { Permission } from "~/plans";

/**
 * Hook to get permissions for an organization from route context
 */
export function usePermissions() {
  const { plan } = useRouteContext({ from: "/(authenticated)/dashboard/$orgSlug" });

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
