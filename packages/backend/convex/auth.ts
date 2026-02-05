import type { GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, BetterAuthOptions } from "better-auth/minimal";
import { apiKey, organization } from "better-auth/plugins";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  }
);

const staticTrustedOrigins = [
  "http://thoughtbase.localhost:3000",
  "http://*.thoughtbase.localhost:3000",
  "https://*-wolkwork.vercel.app",
  "https://*.thoughtbase.app",
  "https://thoughtbase.app",
];

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    // baseURL: "http://thoughtbase.localhost:3000",
    trustedOrigins: async (request?: Request): Promise<string[]> => {
      const trustedOrigins = [...staticTrustedOrigins];

      if (!request) {
        return trustedOrigins;
      }

      const origin = request.headers.get("origin");

      if (!origin) {
        return trustedOrigins;
      }

      // Check if the origin is a verified custom domain
      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        const org = await ctx.runQuery(
          components.betterAuth.functions.getOrganizationByCustomDomain,
          { customDomain: hostname }
        );

        if (org && org.domainVerificationStatus === "verified") {
          trustedOrigins.push(origin);
        }
      } catch {
        // Invalid URL or query failed, just return static origins
      }

      return trustedOrigins;
    },

    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // Cookie configuration to ensure cookies work across all routes
    // This is necessary because the auth API is at /subdomain/$slug/api/auth/*
    // but the cookies need to be available at /subdomain/$slug/* as well
    advanced: {
      defaultCookieAttributes: {
        path: "/",
        sameSite: "lax",
      },
    },
    plugins: [
      organization(),
      apiKey(),
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});

export const getSafeCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

export interface UnifiedUser {
  type: "internal" | "external";
  _id: string | Id<"externalUser">;
  email?: string;
  name?: string;
  image?: string;
  organizationId?: string;
}

export const getUnifiedUser = query({
  args: {
    sessionId: v.union(
      v.literal("no-external-session"),
      v.id("externalSession")
    ),
  },

  handler: async (ctx, { sessionId }): Promise<UnifiedUser | undefined> => {
    if (sessionId !== "no-external-session") {
      const session = await ctx.db.get(sessionId);

      if (session && Date.now() < session.expiresAt) {
        const externalUser = await ctx.db.get(session.externalUserId);

        if (externalUser) {
          return {
            ...externalUser,
            type: "external",
            image: externalUser.avatarUrl ?? undefined,
          };
        }
      }
    }

    const user = await authComponent.safeGetAuthUser(ctx);

    if (user) {
      return {
        ...user,
        image: user.image ?? undefined,
        type: "internal",
      };
    }

    return undefined;
  },
});

export const getUnifiedProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("profile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const organizations = await auth.api.listOrganizations({
      headers,
    });

    return organizations;
  },
});

export const getOrganizationBySlug = query({
  args: { slug: v.string() },
  handler: (ctx, { slug }) => {
    return ctx.runQuery(components.betterAuth.functions.getOrganizationBySlug, {
      slug,
    });
  },
});

export const getOrganizationById = query({
  args: { id: v.string() },
  handler: (ctx, { id }) => {
    return ctx.runQuery(components.betterAuth.functions.getOrganizationById, {
      id,
    });
  },
});

export const checkMembership = query({
  args: { organizationId: v.string(), userId: v.string() },
  handler: async (ctx, { organizationId, userId }) => {
    return await ctx.runQuery(components.betterAuth.functions.checkMembership, {
      organizationId,
      userId,
    });
  },
});
