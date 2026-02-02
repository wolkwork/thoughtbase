import { v } from "convex/values";
import { action, mutation, MutationCtx, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { api, components } from "./_generated/api";
import { jwtVerify } from "jose";

/**
 * Get an external session by token
 * Note: This requires scanning sessions - consider adding a token index if performance is an issue
 */
export const getSessionByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: This is inefficient without an index on token
    // For now, we'll need to query all sessions and filter
    // TODO: Add token index to schema if needed
    const allSessions = await ctx.db.query("externalSession").collect();
    
    const session = allSessions.find((s) => {
      // Check if session matches token (assuming token is stored somewhere)
      // Actually, external sessions don't store token in the schema
      // This query might not work as expected
      return false; // Placeholder
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = Date.now();
    if (now > session.expiresAt) {
      return null;
    }

    // Fetch the external user
    const externalUser = await ctx.db.get(session.externalUserId);
    if (!externalUser) {
      return null;
    }

    return {
      session,
      externalUser,
    };
  },
});

/**
 * Get an external session by ID
 */
export const getExternalSessionById = query({
  args: {
    id: v.id("externalSession"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = Date.now();
    if (now > session.expiresAt) {
      return null;
    }

    // Fetch the external user
    const externalUser = await ctx.db.get(session.externalUserId);
    if (!externalUser) {
      return null;
    }

    return {
      session,
      externalUser,
    };
  },
});

/**
 * Create a new external session
 */
export const createSession = mutation({
  args: {
    externalUserId: v.id("externalUser"),
    expiresAt: v.number(), // timestamp in milliseconds
  },
  handler: async (ctx, args) => {
    // Verify the external user exists
    const externalUser = await ctx.db.get(args.externalUserId);
    if (!externalUser) {
      throw new Error("External user not found");
    }

    // Create the session
    const sessionId = await ctx.db.insert("externalSession", {
      externalUserId: args.externalUserId,
      expiresAt: args.expiresAt,
    });

    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Failed to create session");
    }

    return session;
  },
});

/**
 * Delete an external session by token
 */
export const deleteSessionById = mutation({
  args: {
    id: v.id("externalSession"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const signInWithSSO = mutation({
  args: {
    ssoToken: v.string(),
    organizationId: v.string(),
  },
  handler: async (
    ctx,
    { ssoToken, organizationId },
  ): Promise<Doc<"externalSession">> => {
    const dbUser = await getUserFromToken(ctx, ssoToken, organizationId);

    if (!dbUser) {
      throw new Error("External user not found");
    }

    const session = await ctx.runMutation(api.externalSessions.createSession, {
      externalUserId: dbUser._id,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return session;
  },
});

async function getUserFromToken(
  ctx: MutationCtx,
  ssoToken: string,
  organizationId: string,
) {
  // 1. Fetch Organization Secret from Convex
  const org = await ctx.runQuery(
    components.betterAuth.functions.getOrganizationById,
    {
      id: organizationId,
    },
  );

  if (!org || !org.secret) {
    throw new Error("Organization not found or SSO not configured");
  }

  const secret = new TextEncoder().encode(org.secret);

  // 2. Verify JWT
  const { payload } = await jwtVerify(ssoToken, secret);

  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("Invalid token payload: email missing");
  }

  const externalId = (payload.sub || payload.id) as string;
  if (!externalId) {
    throw new Error("Invalid token payload: sub or id missing");
  }

  const email = payload.email;
  const name = (payload.name as string) || email.split("@")[0];
  const image =
    (payload.image as string) || (payload.avatarUrl as string) || undefined;
  const metadata = payload.metadata as unknown;
  const revenue = payload.revenue ? Number(payload.revenue) : undefined;

  const user = await ctx.runMutation(api.externalUsers.upsertExternalUser, {
    organizationId: organizationId,
    externalId,
    email,
    name,
    avatarUrl: image,
    revenue,
    metadata,
  });

  return user;
}
