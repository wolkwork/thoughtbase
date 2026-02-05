import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { env } from "~/env/server";

const EXTERNAL_SESSION_COOKIE_NAME = "thoughtbase-external-session-id";
const COOKIE_MAX_AGE_DAYS = 7;

/** Server-only: read external session id from cookie. Used by subdomain route loader. */
export const getExternalSessionIdFromCookie = createServerFn({
  method: "GET",
}).handler(async () => {
  return getCookie(EXTERNAL_SESSION_COOKIE_NAME) ?? null;
});

type ExchangeSsoTokenInput = {
  ssoToken: string;
  organizationId: string;
  redirectPath: string;
};

export const $exchangeSsoToken = createServerFn({
  method: "POST",
})
  .inputValidator((data: ExchangeSsoTokenInput) => data)
  .handler(async (ctx) => {
    const { ssoToken, organizationId, redirectPath } = ctx.data;
    const convex = new ConvexHttpClient(env.CONVEX_URL);
    const session = await convex.mutation(api.externalSessions.signInWithSSO, {
      ssoToken,
      organizationId,
    });

    setCookie(EXTERNAL_SESSION_COOKIE_NAME, session._id, {
      path: "/",
      maxAge: 60 * 60 * 24 * COOKIE_MAX_AGE_DAYS,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return { redirectTo: redirectPath };
  });

export { EXTERNAL_SESSION_COOKIE_NAME };
