import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/end-user-auth/auth";

export const Route = createFileRoute("/api/auth/end-user/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return auth.handler(request);
      },
      POST: ({ request }) => {
        return auth.handler(request);
      },
    },
  },
});
