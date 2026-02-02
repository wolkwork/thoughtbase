import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

/**
 * Get ideas for widget by organization slug
 * Returns public roadmap ideas (excludes pending)
 */
export const getWidgetIdeas = query({
  args: {
    organizationSlug: v.string(),
  },
  handler: async (ctx, args): Promise<any[]> => {
    return await ctx.runQuery(api.ideas.getPublicRoadmapIdeas, {
      organizationSlug: args.organizationSlug,
    });
  },
});

/**
 * Create an idea from widget
 * Handles organization slug lookup and external session via SSO token
 * Allows external users (who aren't organization members) to submit ideas
 */
export const createWidgetIdea = mutation({
  args: {
    organizationSlug: v.string(),
    title: v.string(),
    description: v.string(),
    ssoToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Doc<"idea">> => {
    // Get organization by slug
    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationBySlug,
      {
        slug: args.organizationSlug,
      },
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get user (internal or external) via session
    let user: { _id: string; type: "internal" | "external" } | null = null;

    if (args.ssoToken) {
      try {
        // signInWithSSO verifies the token and creates/gets the external user and session
        const session = await ctx.runMutation(
          api.externalSessions.signInWithSSO,
          {
            ssoToken: args.ssoToken,
            organizationId: organization._id,
          },
        );

        // Get the external user from the session
        const sessionData = await ctx.runQuery(
          api.externalSessions.getExternalSessionById,
          {
            id: session._id,
          },
        );

        if (sessionData?.externalUser) {
          user = {
            _id: sessionData.externalUser._id,
            type: "external",
          };
        }
      } catch (error) {
        // If SSO fails, throw error (don't allow anonymous submissions)
        throw new Error(
          "SSO authentication failed: " + (error as Error).message,
        );
      }
    } else {
      // Try to get internal user
      const internalUser = await ctx.runQuery(api.auth.getUnifiedUser, {
        sessionId: "no-external-session",
      });
      if (internalUser) {
        user = {
          _id: internalUser._id,
          type: "internal",
        };
      }
    }

    // Create the idea directly (bypassing membership check for widget submissions)
    // For external users, we use the external user ID as a string in authorId
    // Note: The schema allows authorId to reference externalUser._id
    const ideaId = await ctx.db.insert("idea", {
      organizationId: organization._id,
      title: args.title,
      authorId: user?._id,
      description: args.description,
      status: "pending",
    });

    // Return the created idea
    const idea = await ctx.db.get(ideaId);
    if (!idea) {
      throw new Error("Failed to create idea");
    }

    return idea;
  },
});

/**
 * Get changelogs for widget by organization slug
 * Returns only published changelogs
 */
export const getWidgetChangelogs = query({
  args: {
    organizationSlug: v.string(),
  },
  handler: async (ctx, args): Promise<any[]> => {
    // Get organization by slug
    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationBySlug,
      {
        slug: args.organizationSlug,
      },
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get published changelogs
    const changelogs = await ctx.runQuery(api.changelogs.getChangelogs, {
      organizationId: organization._id,
      status: "published",
    });

    return changelogs;
  },
});

/**
 * Get organization branding settings for widget
 */
export const getWidgetOrganization = query({
  args: {
    organizationSlug: v.string(),
  },
  handler: async (ctx, args) => {
    // Get organization by slug
    const organization = await ctx.runQuery(
      components.betterAuth.functions.getOrganizationBySlug,
      {
        slug: args.organizationSlug,
      },
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    // For now, return default branding settings
    // TODO: Add showThoughtbaseBranding to organization schema if needed
    return {
      showThoughtbaseBranding: true, // Default to showing branding
    };
  },
});
