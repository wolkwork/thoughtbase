import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@thoughtbase/backend/convex/_generated/api";

export function useConfig() {
  const { data: isCloud } = useSuspenseQuery(convexQuery(api.config.isCloud, {}));

  return {
    isCloud,
  };
}
