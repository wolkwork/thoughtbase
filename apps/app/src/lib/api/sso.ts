import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getUserFromToken } from "~/lib/auth/external-auth";
import { db } from "~/lib/db";
import { externalSession } from "~/lib/db/schema";

export const $signInWithSSO = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string(),
      organizationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const dbUser = await getUserFromToken(data.token, data.organizationId);

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
