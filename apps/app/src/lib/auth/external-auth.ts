import { getRequest } from "@tanstack/react-start/server";
import { api, getConvexClient } from "~/lib/convex/client";

/**
 * Get user from SSO token
 * This function verifies the JWT token and returns the external user
 * Note: This creates a session as a side effect via signInWithSSO
 */
export async function getUserFromToken(
  token: string,
  organizationId: string,
): Promise<
  | {
      id: string;
      email?: string;
      name?: string;
      avatarUrl?: string;
      revenue?: number;
      metadata?: unknown;
    }
  | undefined
> {
  try {
    const convexClient = getConvexClient();

    // signInWithSSO verifies the token and creates a session
    // We need to get the user from the session
    const session = await convexClient.mutation(api.externalSessions.signInWithSSO, {
      ssoToken: token,
      organizationId,
    });

    if (!session) {
      return undefined;
    }

    // Get the external user by querying the session with the user
    // We can get the user directly from the database via a query
    // For now, we'll need to get it from the session's externalUserId
    // Since we don't have a direct query, we'll use getExternalSessionById
    const sessionWithUser = await convexClient.query(
      api.externalSessions.getExternalSessionById,
      {
        id: session._id,
      },
    );

    if (!sessionWithUser || !sessionWithUser.externalUser) {
      return undefined;
    }

    const externalUser = sessionWithUser.externalUser;

    return {
      id: externalUser._id,
      email: externalUser.email,
      name: externalUser.name,
      avatarUrl: externalUser.avatarUrl || undefined,
      revenue: externalUser.revenue || undefined,
      metadata: externalUser.metadata || undefined,
    };
  } catch (error) {
    console.error("Error getting user from token:", error);
    return undefined;
  }
}

/**
 * Get unified auth context (internal or external user)
 */
export async function getUnifiedAuthContext() {
  const request = getRequest();
  const cookieHeader = request.headers.get("cookie");

  // Extract feedback_widget_token from cookies
  const tokenMatch = cookieHeader?.match(/feedback_widget_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    return null;
  }

  const convexClient = getConvexClient();

  // Get session by token
  const sessionData = await convexClient.query(api.externalSessions.getSessionByToken, {
    token,
  });

  if (!sessionData || !sessionData.session || !sessionData.externalUser) {
    return null;
  }

  // Check if session is expired
  if (Date.now() > sessionData.session.expiresAt) {
    return null;
  }

  return {
    type: "external" as const,
    user: {
      id: sessionData.externalUser._id,
      email: sessionData.externalUser.email,
      name: sessionData.externalUser.name,
      avatarUrl: sessionData.externalUser.avatarUrl,
    },
    session: sessionData.session,
  };
}
