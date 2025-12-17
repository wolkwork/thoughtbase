import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../auth/auth";
import { getUserFromToken } from "../auth/external-auth";

export async function getUnifiedUser({
  token,
  organizationId,
}: {
  token?: string;
  organizationId: string;
}) {
  if (token) {
    const externalUser = await getUserFromToken(token, organizationId);
    if (externalUser) {
      return {
        type: "external" as const,
        id: externalUser.id,
        email: externalUser.email,
        name: externalUser.name,
        image: externalUser.avatarUrl,
        organizationId,
      };
    }
  }

  const session = await auth.api.getSession({
    headers: getRequest().headers,
  });

  if (session?.user) {
    return {
      type: "internal" as const,
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      organizationId,
    };
  }

  return null;
}
