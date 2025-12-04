import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { parse } from "es-cookie";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { externalSession } from "~/lib/db/schema";

export async function getWidgetAuthContext() {
  // 1. Try getting cookie from request headers
  const request = getRequest();
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  const token = cookies["feedback_widget_token"];

  if (!token) return null;

  // 2. Validate session
  const session = await db.query.externalSession.findFirst({
    where: eq(externalSession.token, token),
    with: {
      externalUser: true,
    },
  });

  if (!session) return null;

  // 3. Check expiry
  if (new Date() > session.expiresAt) {
    return null;
  }

  return {
    externalUser: session.externalUser,
    session: session,
  };
}

// Helper to get either authenticated user (dashboard) or external user (widget)
export async function getUnifiedAuthContext() {
  // 1. Try standard auth first
  const dashboardSession = await auth.api.getSession({
    headers: getRequest().headers,
  });

  if (dashboardSession?.session?.activeOrganizationId) {
    return {
      type: "internal" as const,
      user: dashboardSession.user,
      organizationId: dashboardSession.session.activeOrganizationId,
      session: dashboardSession.session,
    };
  }

  // 2. Try widget auth
  const widgetCtx = await getWidgetAuthContext();
  if (widgetCtx) {
    return {
      type: "external" as const,
      user: widgetCtx.externalUser,
      organizationId: widgetCtx.externalUser.organizationId,
      session: widgetCtx.session,
    };
  }

  return null;
}
