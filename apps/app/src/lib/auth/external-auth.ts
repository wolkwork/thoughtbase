import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { parse } from "es-cookie";
import { jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { externalSession, externalUser, organization } from "~/lib/db/schema";

export async function getUserFromToken(token: string, organizationId: string) {
  // 1. Fetch Organization Secret
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { secret: true },
  });

  if (!org || !org.secret) {
    throw new Error("Organization not found or SSO not configured");
  }

  const secret = new TextEncoder().encode(org.secret);

  // 2. Verify JWT
  const { payload } = await jwtVerify(token, secret);

  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("Invalid token payload: email missing");
  }

  const externalId = (payload.sub || payload.id) as string;
  if (!externalId) {
    throw new Error("Invalid token payload: sub or id missing");
  }

  const email = payload.email;
  const name = (payload.name as string) || email.split("@")[0];
  const image = (payload.image as string) || (payload.avatarUrl as string) || null;
  const metadata = payload.metadata as unknown;
  const revenue = Number(payload.revenue) || null;

  // 3. Upsert External User
  const [user] = await db
    .insert(externalUser)
    .values({
      id: nanoid(),
      organizationId: organizationId,
      externalId,
      email,
      name,
      avatarUrl: image,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [externalUser.organizationId, externalUser.externalId],
      set: {
        name,
        email,
        avatarUrl: image,
        metadata,
        revenue,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

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
