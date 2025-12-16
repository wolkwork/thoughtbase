import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getUnifiedAuthContext } from "~/lib/auth/external-auth";
import { db } from "~/lib/db";
import { externalUser, profile } from "~/lib/db/schema";

export const $getUnifiedUser = createServerFn({ method: "GET" }).handler(async () => {
  const ctx = await getUnifiedAuthContext();
  if (!ctx) return null;

  return {
    id: ctx.user.id,
    email: ctx.user.email,
    name: ctx.user.name,
    image: ctx.type === "internal" ? ctx.user.image : ctx.user.avatarUrl,
    type: ctx.type, // "internal" | "external"
    organizationId: ctx.organizationId,
  };
});

export const $getUnifiedProfile = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await getUnifiedAuthContext();
    if (!ctx) return null;

    // If requesting profile for a different org than the one authenticated with (for external), deny.
    if (ctx.type === "external" && ctx.organizationId !== data.organizationId) {
      return null;
    }

    if (ctx.type === "external") {
      // External users effectively "are" their profile in that org
      return {
        id: ctx.user.id, // Using user ID as profile ID for simplicity/uniqueness in this context
        userId: ctx.user.id,
        organizationId: ctx.organizationId,
        name: ctx.user.name,
        image: ctx.user.avatarUrl,
        // Mocking other profile fields if necessary
      };
    }

    // For internal users, fetch from profile table
    const userProfile = await db.query.profile.findFirst({
      where: and(
        eq(profile.userId, ctx.user.id),
        eq(profile.organizationId, data.organizationId),
      ),
    });

    return userProfile || null;
  });

export const $upsertUnifiedProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      name: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await getUnifiedAuthContext();
    if (!ctx) throw new Error("Not authenticated");

    // Check organization scope for external users
    if (ctx.type === "external" && ctx.organizationId !== data.organizationId) {
      throw new Error("Unauthorized organization scope");
    }

    if (ctx.type === "external") {
      // Update external user name
      const [updatedUser] = await db
        .update(externalUser)
        .set({
          name: data.name,
          updatedAt: new Date(),
        })
        .where(eq(externalUser.id, ctx.user.id))
        .returning();

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        image: updatedUser.avatarUrl,
      };
    }

    // For internal users
    const [newProfile] = await db
      .insert(profile)
      .values({
        id: crypto.randomUUID(),
        userId: ctx.user.id,
        organizationId: data.organizationId,
        name: data.name,
      })
      .onConflictDoUpdate({
        target: [profile.userId, profile.organizationId],
        set: {
          name: data.name,
          updatedAt: new Date(),
        },
      })
      .returning();

    return newProfile;
  });
