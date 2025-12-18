import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth/auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
    query: {
      disableCookieCache: true,
    },
  });

  if (!session) {
    throw redirect({ to: "/login", search: { redirect: getRequest().url } });
  }

  return next({ context: { user: session.user } });
});
