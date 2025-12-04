import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "~/lib/db";
import { externalSession, externalUser, organization } from "~/lib/db/schema";

export const $signInWithSSO = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string(),
      organizationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // 1. Fetch Organization Secret
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
      columns: { secret: true },
    });

    if (!org || !org.secret) {
      throw new Error("Organization not found or SSO not configured");
    }

    const secret = new TextEncoder().encode(org.secret);

    try {
      // 2. Verify JWT
      const { payload } = await jwtVerify(data.token, secret);

      if (!payload.email || typeof payload.email !== "string") {
        throw new Error("Invalid token payload: email missing");
      }

      // Use 'sub' or 'id' from JWT as the stable external ID
      const externalId = (payload.sub || payload.id) as string;
      if (!externalId) {
        throw new Error("Invalid token payload: sub or id missing");
      }

      const email = payload.email;
      const name = (payload.name as string) || email.split("@")[0];
      const image = (payload.image as string) || (payload.avatarUrl as string) || null;

      // 3. Find or Create External User
      let dbUser = await db.query.externalUser.findFirst({
        where: and(
          eq(externalUser.organizationId, data.organizationId),
          eq(externalUser.externalId, externalId),
        ),
      });

      if (dbUser) {
        // Update details if changed
        await db
          .update(externalUser)
          .set({ name, email, avatarUrl: image, updatedAt: new Date() })
          .where(eq(externalUser.id, dbUser.id));
      } else {
        const [newUser] = await db
          .insert(externalUser)
          .values({
            id: nanoid(),
            organizationId: data.organizationId,
            externalId,
            email,
            name,
            avatarUrl: image,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        dbUser = newUser;
      }

      // 4. Create External Session
      const token = nanoid(64);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

      await db.insert(externalSession).values({
        id: nanoid(),
        externalUserId: dbUser.id,
        token,
        expiresAt,
        createdAt: new Date(),
      });

      // 5. Set Scoped Session Cookie
      const request = getRequest();
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const requestUrl = origin || referer || "";

      const isLocal =
        requestUrl.includes("localhost") || requestUrl.includes("127.0.0.1");
      const isSecure = requestUrl.startsWith("https");

      let cookieAttributes = "SameSite=None; Secure";

      if (isLocal && !isSecure) {
        cookieAttributes = "SameSite=Lax";
      }

      setResponseHeader(
        "Set-Cookie",
        `feedback_widget_token=${token}; Path=/; HttpOnly; ${cookieAttributes}; Max-Age=${60 * 60 * 24 * 30}`,
      );

      return { success: true };
    } catch (error) {
      console.error("SSO Error:", error);
      throw new Error("Authentication failed");
    }
  });
