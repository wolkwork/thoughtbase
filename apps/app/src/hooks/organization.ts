import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";

export function useOrganization() {
  const { orgSlug } = useParams({ from: "/(authenticated)/dashboard/$orgSlug" });

  const result = useSuspenseQuery(
    convexQuery(api.auth.getOrganizationBySlug, { slug: orgSlug }),
  );

  if (!result.data) {
    throw Error("useOrganization can only be used in authenticated routes");
  }

  return result.data;
}
