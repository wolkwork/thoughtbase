import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "~/lib/auth/auth";
import { db } from "~/lib/db";
import { profile } from "~/lib/db/schema";

export const $getSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
    returnHeaders: true,
  });

  // Forward any Set-Cookie headers to the client, e.g. for session/cache refresh
  const cookies = session.headers?.getSetCookie();
  if (cookies?.length) {
    setResponseHeader("Set-Cookie", cookies);
  }

  return session.response || null;
});

export const $getOrgProfile = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .handler(async ({ data }) => {
    const session = await $getSession();
    if (!session?.user) return null;

    const userProfile = await db.query.profile.findFirst({
      where: and(
        eq(profile.userId, session.user.id),
        eq(profile.organizationId, data.organizationId),
      ),
    });

    return userProfile || null;
  });

export const $upsertOrgProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      name: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const session = await $getSession();
    if (!session?.user) throw new Error("Not authenticated");

    const [newProfile] = await db
      .insert(profile)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
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
